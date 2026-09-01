'use strict';

var server = require('server');

server.extend(module.superModule);

function getValueOrEmpty(value) {
    if (value === null || value === undefined) {
        return '';
    }

    var normalized = String(value).trim();
    return normalized;
}

function findFirstString(values, matcher) {
    for (var i = 0; i < values.length; i++) {
        if (matcher(values[i])) {
            return values[i];
        }
    }

    return '';
}

function collectStringsDeep(value, collector) {
    if (!value) {
        return;
    }

    if (typeof value === 'string') {
        var normalized = getValueOrEmpty(value);
        if (normalized) {
            collector.push(normalized);
        }
        return;
    }

    if (Array.isArray(value)) {
        value.forEach(function (item) {
            collectStringsDeep(item, collector);
        });
        return;
    }

    if (typeof value === 'object') {
        Object.keys(value).forEach(function (key) {
            collectStringsDeep(value[key], collector);
        });
    }
}

function extractStripeErrorTextFromResponse(payload) {
    var values = [];

    collectStringsDeep(payload && payload.errorMessage, values);
    collectStringsDeep(payload && payload.serverErrors, values);
    collectStringsDeep(payload && payload.fieldErrors, values);
    collectStringsDeep(payload && payload.error, values);
    collectStringsDeep(payload && payload.order, values);

    var directDecline = findFirstString(values, function (msg) {
        return /your card was declined/i.test(msg);
    });

    if (directDecline) {
        return directDecline;
    }

    return findFirstString(values, function (msg) {
        return /(declin|insufficient|do_not_honor|incorrect_cvc|security code|expired card|authentication required|generic_decline|card_error|payment_intent)/i.test(msg);
    });
}

function getOrderNoteText(note) {
    if (!note) {
        return '';
    }

    var subject = '';
    var text = '';

    try {
        subject = getValueOrEmpty(typeof note.getSubject === 'function' ? note.getSubject() : note.subject);
    } catch (e) {
        subject = '';
    }

    try {
        text = getValueOrEmpty(typeof note.getText === 'function' ? note.getText() : note.text);
    } catch (e) {
        text = '';
    }

    return [subject, text].join(' ').trim();
}

function extractStripeErrorTextFromOrder(order) {
    if (!order || typeof order.getNotes !== 'function') {
        return '';
    }

    var notes;
    try {
        notes = order.getNotes();
    } catch (e) {
        return '';
    }

    if (!notes || typeof notes.iterator !== 'function') {
        return '';
    }

    var candidates = [];
    var iterator = notes.iterator();

    while (iterator.hasNext()) {
        var noteText = getOrderNoteText(iterator.next());
        if (noteText) {
            candidates.push(noteText);
        }
    }

    // Start from latest note because Stripe intent failure is appended near the end.
    for (var i = candidates.length - 1; i >= 0; i--) {
        if (/error when create stripe payment intent|stripe error|payment intent/i.test(candidates[i])) {
            if (/your card was declined/i.test(candidates[i])) {
                return 'Your card was declined.';
            }

            if (/(declin|insufficient|do_not_honor|incorrect_cvc|security code|expired card|authentication required|generic_decline|card_error)/i.test(candidates[i])) {
                return candidates[i];
            }
        }
    }

    return '';
}

function normalizeDeclineMessage(rawMessage) {
    var raw = getValueOrEmpty(rawMessage);

    if (!raw) {
        return '';
    }

    if (/your card was declined/i.test(raw)) {
        return 'Your card was declined. Please try another card.';
    }

    if (/(declin|insufficient|do_not_honor|incorrect_cvc|security code|expired card|authentication required|generic_decline|card_error|pickup_card|stolen_card|lost_card)/i.test(raw)) {
        return 'Payment was declined. Please try another card or payment method.';
    }

    return '';
}

function ensureFailedOrderState(order) {
    if (!order) {
        return;
    }

    var Order = require('dw/order/Order');
    var OrderMgr = require('dw/order/OrderMgr');
    var Transaction = require('dw/system/Transaction');

    if (order.status.value === Order.ORDER_STATUS_FAILED || order.status.value === Order.ORDER_STATUS_CANCELLED) {
        return;
    }

    Transaction.wrap(function () {
        OrderMgr.failOrder(order, true);
    });
}

function addMappedDeclineNote(order, mappedMessage) {
    if (!order || !mappedMessage) {
        return;
    }

    var Transaction = require('dw/system/Transaction');
    var noteText = getValueOrEmpty(mappedMessage);

    if (!noteText) {
        return;
    }

    Transaction.wrap(function () {
        order.addNote('Stripe Decline UI Message', noteText);
    });
}

server.prepend('PaymentElementSubmitOrder', function (req, res, next) {
    var OrderMgr = require('dw/order/OrderMgr');

    var originalJson = res.json;

    res.json = function (payload) {
        var responsePayload = payload || {};

        if (responsePayload && responsePayload.error) {
            var orderNo = session.privacy && session.privacy.stripeOrderNumber;
            var order = orderNo ? OrderMgr.getOrder(orderNo) : null;

            var responseErrorText = extractStripeErrorTextFromResponse(responsePayload);
            var orderErrorText = extractStripeErrorTextFromOrder(order);
            var normalizedDeclineMessage = normalizeDeclineMessage(responseErrorText || orderErrorText);

            if (normalizedDeclineMessage) {
                responsePayload.errorMessage = normalizedDeclineMessage;
                responsePayload.serverErrors = [normalizedDeclineMessage];

                addMappedDeclineNote(order, normalizedDeclineMessage);

                // Ensure failed/declined orders never continue through happy-path response fields.
                delete responsePayload.orderID;
                delete responsePayload.orderToken;
                delete responsePayload.continueUrl;

                ensureFailedOrderState(order);
            }
        }

        return originalJson.call(this, responsePayload);
    };

    return next();
});

module.exports = server.exports();
