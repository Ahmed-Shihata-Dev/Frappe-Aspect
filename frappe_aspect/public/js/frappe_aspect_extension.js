frappe.provide("frappe.views");

(function() {
    // Save the original setup_view_menu method
    const original_setup_view_menu = frappe.views.BaseList.prototype.setup_view_menu;

    // Override the setup_view_menu method
    frappe.views.BaseList.prototype.setup_view_menu = function() {
        // Call the original method
        original_setup_view_menu.call(this);

        // Add Frappe Aspect option
        if (!this.views_menu) return;

        const frappe_aspect_option = `
            <li data-view="FrappeAspect">
                <a class="grey-link dropdown-item" href="#" onclick="return false;">
                    <span class="menu-item-icon">
                        <svg class="icon icon-sm" aria-hidden="true">
                            <use href="#icon-dashboard"></use>
                        </svg>
                    </span>
                    <span class="menu-item-label" data-label="FrappeAspect">
                        <span>
                            <span class="alt-underline">F</span>rappe Aspect
                        </span>
                    </span>
                </a>
            </li>`;
        $(frappe_aspect_option).appendTo(this.views_menu);

        this.views_menu.find('[data-view="FrappeAspect"]').on('click', function() {
            const doctype = frappe.get_route()[1];
            const route = `/app/frappe_aspect/${doctype}/frappe_aspect`;
            frappe.set_route(route);
        });
    };
})();
