frappe.provide("frappe.views");

(function() {
	const original_setup_view_menu = frappe.views.BaseList.prototype.setup_view_menu;

	frappe.views.BaseList.prototype.setup_view_menu = function() {
		original_setup_view_menu.call(this);

		// Only add the menu entry on standard desk list views — not inside Aspect View
		if (!this.views_menu || this.views_menu.find('[data-view="AspectView"]').length) {
			return;
		}
		if ($(this.parent).closest("#frappe-aspect-list").length) {
			return;
		}
		if (frappe.get_route()[0] === "frappe_aspect") {
			return;
		}

		const aspect_view_option = `
			<li data-view="AspectView">
				<a class="grey-link dropdown-item" href="#" onclick="return false;">
					<span class="menu-item-icon">
						<svg class="icon icon-sm" aria-hidden="true">
							<use href="#icon-dashboard"></use>
						</svg>
					</span>
					<span class="menu-item-label" data-label="AspectView">
						<span>
							<span class="alt-underline">A</span>spect View
						</span>
					</span>
				</a>
			</li>`;
		$(aspect_view_option).appendTo(this.views_menu);

		this.views_menu.find('[data-view="AspectView"]').on("click", function() {
			const doctype = frappe.get_route()[1];
			frappe.set_route(`/app/frappe_aspect/${doctype}/frappe_aspect`);
		});
	};
})();
