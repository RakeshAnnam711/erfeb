# Catalog Category and Product Revalidation Checklist

## Purpose

Use this checklist to validate catalog categories and products after an update, migration, integration, or release.

## Category Revalidation

### Structure and hierarchy

- [ ] Category IDs are unique.
- [ ] Category names are correct and complete.
- [ ] Each category has the correct parent.
- [ ] There are no duplicate, orphaned, or circular categories.
- [ ] Category hierarchy and breadcrumb paths are correct.
- [ ] Category display order is correct.

### Status and visibility

- [ ] Active categories are visible and inactive categories are hidden.
- [ ] Start and end dates are correct.
- [ ] Categories appear in the correct navigation menus.
- [ ] Hidden or search-only categories do not appear unexpectedly.
- [ ] Empty categories are handled according to business requirements.

### Content and localization

- [ ] Display names and descriptions are accurate.
- [ ] Banners, images, and landing-page content display correctly.
- [ ] Content has no spelling, formatting, or broken-link issues.
- [ ] Required translations are complete and accurate.
- [ ] Fallback content works correctly.

### Product assignments

- [ ] Products are assigned to the correct categories.
- [ ] Products are not assigned to unintended categories.
- [ ] Primary category assignments are correct.
- [ ] Product ordering within categories is correct.
- [ ] Active categories contain the expected products.
- [ ] Unavailable products are handled correctly.

### Filters and sorting

- [ ] Required filters appear in the correct categories.
- [ ] Filter names and values match product data.
- [ ] Filter counts match displayed products.
- [ ] Individual and combined filters return expected results.
- [ ] Price ranges have no incorrect gaps or overlaps.
- [ ] Default and customer-selected sorting work correctly.

### SEO

- [ ] Category URLs are unique and readable.
- [ ] Page titles, meta descriptions, and headings are correct.
- [ ] Canonical URLs are correct.
- [ ] Redirects exist for renamed, moved, or removed categories.
- [ ] Indexing settings and sitemap inclusion are correct.

## Product Revalidation

### Identity and status

- [ ] Product IDs and SKUs are unique.
- [ ] Product types and relationships are correct.
- [ ] Product identifiers match connected systems.
- [ ] Active and inactive statuses are correct.
- [ ] Start and end dates are correct.
- [ ] Products are assigned to the correct sales channels.
- [ ] Discontinued and future-dated products are handled correctly.

### Product information

- [ ] Product names and descriptions are complete and accurate.
- [ ] Brand, color, size, material, condition, and required attributes are populated.
- [ ] Attribute values follow approved formats and naming conventions.
- [ ] Dimensions, weight, and specifications are accurate.
- [ ] Content contains no invalid formatting or broken links.
- [ ] Required translations are complete and accurate.

### Variants and relationships

- [ ] Parent and variant relationships are correct.
- [ ] Every variant has a unique attribute combination.
- [ ] Required variation values are available.
- [ ] No orphan variants or empty parent products exist.
- [ ] Product sets and bundles contain valid products.
- [ ] Selecting a variant updates SKU, price, image, and availability.

### Pricing

- [ ] Every sellable product has a valid price.
- [ ] Prices use the correct currency.
- [ ] List, sale, and promotional prices display correctly.
- [ ] Price validity dates are correct.
- [ ] Customer- or channel-specific pricing works correctly.
- [ ] Missing, zero, negative, or unusually high prices are reviewed.
- [ ] Tax and rounding behavior are correct.

### Inventory and availability

- [ ] Inventory records exist for sellable products.
- [ ] Stock quantities are accurate.
- [ ] In-stock, out-of-stock, preorder, and backorder behavior is correct.
- [ ] Availability dates are correct.
- [ ] Store or warehouse inventory is mapped correctly.
- [ ] Purchase quantity limits work correctly.
- [ ] Availability is consistent across listing, detail, cart, and checkout pages.

### Images and media

- [ ] Primary, alternate, and variant images display correctly.
- [ ] Required image sizes are available.
- [ ] Images are clear, correctly cropped, and not duplicated.
- [ ] Image URLs are secure and valid.
- [ ] Videos and other media work correctly.
- [ ] Alternative text is meaningful and accurate.

### Search and storefront behavior

- [ ] Products can be found by ID, SKU, name, and relevant keywords.
- [ ] Products appear in the correct category and search results.
- [ ] Search filters use the correct product attributes.
- [ ] Product cards show the correct details.
- [ ] Product detail pages load successfully.
- [ ] Add-to-cart behavior works correctly.
- [ ] Product information remains consistent through checkout.

### SEO, analytics, and compliance

- [ ] Product URLs, metadata, and canonical URLs are correct.
- [ ] Structured product data is accurate.
- [ ] Eligible products are included in the sitemap.
- [ ] Discontinued products follow the approved policy.
- [ ] Required legal, safety, warranty, shipping, and returns information is visible.
- [ ] Analytics capture correct product, category, price, and variant data.

## End-to-End Validation

- [ ] Open each main category from the navigation menu.
- [ ] Confirm the title, breadcrumb, content, product count, and products.
- [ ] Test filters, sorting, and pagination.
- [ ] Open representative products from each category.
- [ ] Test all product variants.
- [ ] Add products to the cart and verify checkout.
- [ ] Test unavailable, inactive, discontinued, and future-dated products.
- [ ] Test supported devices, browsers, languages, currencies, and customer groups.
- [ ] Confirm that no catalog-related errors appear in application logs.

## Validation Report Template

| Field | Details |
|---|---|
| Test ID | Unique test reference |
| Area | Category, Product, Price, Inventory, Search, or SEO |
| Category ID | Category being tested |
| Product ID or SKU | Product being tested |
| Test Scenario | Validation performed |
| Expected Result | Required behavior |
| Actual Result | Observed behavior |
| Status | Pass, Fail, Blocked, or Not Applicable |
| Severity | Critical, High, Medium, or Low |
| Evidence | Screenshot, URL, log, or file reference |
| Owner | Responsible person or team |
| Defect ID | Related issue reference |
| Retest Result | Result after correction |

## Release Acceptance Criteria

- [ ] No unresolved critical defects remain.
- [ ] Category hierarchy and navigation are correct.
- [ ] Product assignments are accurate.
- [ ] Active products are visible, correctly priced, and orderable.
- [ ] No unexpected empty categories or broken pages exist.
- [ ] Search, filters, sorting, images, and localization work correctly.
- [ ] Data is consistent across listing, detail, cart, and checkout pages.
- [ ] Business and technical owners have approved the results.
