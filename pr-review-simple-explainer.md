
**1. Badges / Item ID**
He wants the item number just tacked onto the existing badge text instead of us drawing it as its own separate box next to the badge. Honestly he's right, we're just showing two things side by side that could be one. It happened because we built the item number thing first, and the badge system got added later on top without anyone going back to merge them. Easy fix.

**2. Host name**
Right now it's one setting for the whole site — you pick a host once and it applies to every live item. His screenshot shows him expecting it inside the actual order screen, like the agent picks the host per order. That only matters if one order could ever have two different hosts in it. I don't think that happens in practice but it's worth just asking him straight up instead of guessing.

**3. Show "is this a live-selling order" on more screens**
We're already saving this correctly, it just doesn't show up anywhere visible in Business Manager besides one spot. He wants it on the order list, order history, etc. This is a non-issue, it's just a display setting in BM, no code needed.

**4. The 30-second polling thing — he really doesn't like this one**
So right now if a customer sits on their cart page, we ping the server every 30 seconds to check if their item expired, and reload the page if it did. He called it out pretty bluntly and honestly it's a fair callout — that's not a great pattern, adds server load for no great reason. He wants us to just check when the page actually loads (cart page, checkout page) instead of running a timer in the background. Agree with this one. Only tradeoff: if someone just sits there doing nothing, the item won't disappear in front of their eyes anymore, it'll just be gone next time they click something.

**5. Expiration removal function is too long**
Should be like 5 lines, ours is more like 35. It's long because we wrapped each item removal in its own try/catch so one broken item doesn't stop the rest. Can definitely tighten this up.

**6. "I don't think we ever hit this code"**
Actually we do, just not in the common case. There's a scenario where a customer already has an agent-added item AND adds their own stuff to the same cart — without this fix, the system would wrongly treat the customer's own item as if the agent added it too. We even have a commit in the history that literally fixes this exact bug. So it's not dead, it's just a specific edge case (mixed cart: agent item + customer's own items together). If we ever decide customers can't do that, then sure, we can drop it.

**7. Clear cart button**
We're currently looping through every line item, every coupon, every discount and removing them one at a time, then recalculating. There's literally one command that deletes the whole basket in one go. No reason not to use it, agreed.

**8. Why touch the badges file**
That file already existed for the site's general badge system (Sale, New, etc) before this project. We added a bit of code to it so the live-selling badge gets applied automatically by category instead of someone manually tagging every product. Fair question from him though — if manual tagging is fine, we don't need to touch that shared file at all, the automation can just live in our own code instead. Comes down to whether manually tagging products is too much extra work for whoever manages the catalog.

**9. "Just hide the price with an isif"**
This one's a bit of a mix-up on his end, worth clarifying on the call. Hiding the price on the product page — that's already just a simple show/hide, no argument there, it's already simple. What he's actually looking at is a different thing: once the item is in the cart, we need to show the ACTUAL discounted number, not just hide/show something. That's not something an isif can do, you need real logic for that. We tested this directly, the cart total was already correct without this piece, but the unit price shown was wrong until we added it. So — can't just swap it for a template check. But it is fair to ask if we even need to show that discounted number specifically, since the total was already right.

**10. Search could break**
If someone searches for something specific and the one result happens to be a live-selling item, we currently filter it out AFTER the search already found it — so they'd see "results found" and then nothing. Genuinely a real bug risk, not made up. His fix is better: don't let these products get indexed for search at all, so they never show up as a "found" result to begin with.

**11. Where the CSC note gets saved — need to actually talk about this one**
Right now the agent's note gets typed into a shipping field first, then we copy it onto the order note. He's asking why not just write it straight to the basket. Our best guess is that the shipping field already has an editable spot in Business Manager's UI and the basket doesn't, so it was the easy place to put it — but honestly not 100% sure, and he already said this needs an actual conversation, so let's not pretend we've answered it here.

**12. agentBasketLineItemLocks.js needs a refactor**
He called it AI-generated and complicated, specifically asked why we wrap a simple true/false check instead of just reading it directly. Real reason: reading a setting before its underlying config exists can actually crash the page, and this has genuinely happened and broken things in this project already, so the wrapping isn't paranoia. That said, there's some extra "is this null" checking stacked on top of the crash protection that doesn't do anything extra — that part can go.

**13. The calculate.js hook — "can we just remove this"**
This runs every time the basket recalculates anything, and keeps re-applying the live-selling discount. Why it has to keep running: there's an existing, unrelated part of the site (Global-e integration) that resets prices back to normal every single time the basket recalculates, as a side effect of something else entirely. If we're not also running on every recalculation to put the discount back, it just vanishes almost instantly. We tried the simple version first — set the price once — and it flat out didn't work, lost that race every time. So no, can't remove it without bringing the bug back. What IS worth discussing: does it need to run literally everywhere, or could we get away with only a couple of key pages instead of the global hook. That's a real tradeoff, not a slam dunk either way.

---

**The one big thing worth asking him directly:** his whole "here's what this should really be" list doesn't mention the special pricing feature at all — the part where the agent's item shows a discounted price. That's the single hardest, most time-consuming thing we built this whole project. Either he assumes it's just covered under "basic attributes" and still wants some version of it, or he's saying agents should apply that discount some totally different way and this whole piece shouldn't exist as custom code. Those two answers are wildly different amounts of work, so worth just asking flat out instead of guessing which one he means.
