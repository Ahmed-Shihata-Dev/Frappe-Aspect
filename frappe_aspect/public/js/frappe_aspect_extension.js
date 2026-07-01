frappe.provide("frappe.views");

(function() {
	const original_setup_view_menu = frappe.views.BaseList.prototype.setup_view_menu;

	frappe.views.BaseList.prototype.setup_view_menu = function() {
		original_setup_view_menu.call(this);

		// Only add the menu entry on standard desk list views — not inside Frappe Aspect
		if (!this.views_menu || this.views_menu.find('[data-view="FrappeAspect"]').length) {
			return;
		}
		if ($(this.parent).closest("#frappe-aspect-list").length) {
			return;
		}
		if (frappe.get_route()[0] === "frappe_aspect") {
			return;
		}

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

		this.views_menu.find('[data-view="FrappeAspect"]').on("click", function() {
			const doctype = frappe.get_route()[1];
			frappe.set_route(`/app/frappe_aspect/${doctype}/frappe_aspect`);
		});
	};
})();
