frappe.provide("frappe.views");
frappe.provide("frappe.ui");
frappe.provide("frappe.frappe_aspect");

frappe.pages['frappe_aspect'].on_page_load = function(wrapper) {
	var doctype = frappe.get_route()[1];
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: doctype,
		single_column: true
	});

	init_frappe_aspect(page);
	set_frappe_aspect_body_class();

	frappe.router.on('change', function() {
		set_frappe_aspect_body_class();
		var route = frappe.get_route();
		if (route[0] === 'frappe_aspect') {
			var doctype = route[1];
			if (doctype) {
				page.set_title(doctype);
				init_list_view(doctype);
			}
		}
	});

	$(window).on('resize.frappe_aspect', frappe.utils.throttle(set_aspect_heights, 200));
};

function set_frappe_aspect_body_class() {
	document.body.classList.toggle(
		'frappe-aspect-active',
		frappe.get_route()[0] === 'frappe_aspect'
	);
}

function init_frappe_aspect(page) {
	page.body.closest('.page-body').addClass('full-width');
	page.custom_actions.removeClass('hide');
	$(frappe.render_template("frappeaspectactions", {})).appendTo(page.custom_actions);
	$(frappe.render_template("frappe_aspect", {})).appendTo(page.body);
	set_empty_state_text();
	$('.frappe-aspect-reset-pane').attr('title', __('Reset Aspect to center'));
	page.custom_actions.find('li').on('click', function() {
		switch_to_list_view();
		return false;
	});

	setup_resizable_pane();
	set_aspect_heights();

	var route = frappe.get_route();
	if (route[0] === 'frappe_aspect') {
		var doctype = route[1];
		if (doctype) {
			init_list_view(doctype);
		}
	}
}

function set_empty_state_text() {
	$('#frappe-aspect-form-empty .empty-title').text(__("No record selected"));
	$('#frappe-aspect-form-empty .empty-hint').text(
		__("Click a row in the list to view and edit its details here.")
	);
}

function apply_list_pane_width(width) {
	$('#frappe-aspect-list').css({ width, flex: 'none' });
}

function reset_pane_width() {
	const $body = $('.frappe-aspect-body');
	if (!$body.length) return;

	localStorage.removeItem('frappe_aspect_list_width');
	const splitter_w = $('.o_frappe_aspect_splitter').outerWidth() || 8;
	const middle_width = Math.max(280, Math.floor(($body.width() - splitter_w) / 2));
	apply_list_pane_width(`${middle_width}px`);
}

function setup_resizable_pane() {
	const $list = $('#frappe-aspect-list');
	const $splitter = $('.o_frappe_aspect_splitter');
	const $body = $('.frappe-aspect-body');

	if (!$list.length || !$splitter.length || !$body.length) return;

	const saved = localStorage.getItem('frappe_aspect_list_width');
	if (saved) {
		const width = parseInt(saved, 10);
		if (width >= 280) {
			apply_list_pane_width(saved);
		} else {
			reset_pane_width();
		}
	} else {
		reset_pane_width();
	}

	$('.frappe-aspect-reset-pane')
		.off('click.frappe_aspect')
		.on('click.frappe_aspect', function(e) {
			e.preventDefault();
			e.stopPropagation();
			reset_pane_width();
		});

	$splitter.off('mousedown.frappe_aspect touchstart.frappe_aspect');
	$splitter.on('mousedown.frappe_aspect touchstart.frappe_aspect', function(e) {
		if ($(e.target).closest('.frappe-aspect-reset-pane').length) return;
		e.preventDefault();

		const is_rtl = document.documentElement.dir === 'rtl';
		const startX = e.clientX ?? e.originalEvent?.touches?.[0]?.clientX ?? 0;
		const startWidth = $list.outerWidth();

		$('body').addClass('frappe-aspect-resizing');

		function on_move(ev) {
			const clientX = ev.clientX ?? ev.originalEvent?.touches?.[0]?.clientX ?? 0;
			const delta = is_rtl ? startX - clientX : clientX - startX;
			const bodyWidth = $body.width();
			let newWidth = startWidth + delta;
			newWidth = Math.max(280, Math.min(newWidth, bodyWidth * 0.75));
			apply_list_pane_width(`${newWidth}px`);
		}

		function on_up() {
			$('body').removeClass('frappe-aspect-resizing');
			$(document).off('.frappe_aspect_resize');
			localStorage.setItem('frappe_aspect_list_width', $('#frappe-aspect-list').css('width'));
		}

		$(document).on('mousemove.frappe_aspect_resize touchmove.frappe_aspect_resize', on_move);
		$(document).on('mouseup.frappe_aspect_resize touchend.frappe_aspect_resize', on_up);
	});
}

function set_aspect_heights() {
	const $page = $('#page-frappe_aspect');
	if (!$page.length) return;

	const pageHeadH = $page.find('> .page-head').outerHeight() || 0;
	const navH = parseInt(
		getComputedStyle(document.documentElement).getPropertyValue('--navbar-height')
	) || 48;
	const available = window.innerHeight - navH - pageHeadH - 2;

	$('.frappe-aspect-body').css('height', `${available}px`);
	$('.frappe-aspect-list, .frappe-aspect-form').css('height', `${available}px`);
}

function switch_to_list_view() {
	let doctype = frappe.get_route()[1];
	frappe.set_route("List", doctype, "List");
}

function reset_form_pane() {
	const $form = $('#frappe-aspect-form');
	$form.children().not('#frappe-aspect-form-empty').remove();
	$form.removeClass('has-doc');
	if (!$form.find('#frappe-aspect-form-empty').length) {
		$form.append(`
			<div class="frappe-aspect-form-empty" id="frappe-aspect-form-empty">
				<div class="empty-state-content">
					<div class="empty-icon">
						<svg class="icon icon-xl" aria-hidden="true">
							<use href="#icon-select"></use>
						</svg>
					</div>
					<div class="empty-title">${__("No record selected")}</div>
					<div class="empty-hint">${__("Click a row in the list to view and edit its details here.")}</div>
				</div>
			</div>
		`);
	}
}

let frappe_aspect_init_timer = null;

function init_list_view(doctype) {
	clearTimeout(frappe_aspect_init_timer);
	frappe_aspect_init_timer = setTimeout(() => {
		_render_list_view(doctype);
	}, 100);
}

function _render_list_view(doctype) {
	$('#frappe-aspect-list').empty();
	reset_form_pane();

	frappe.model.with_doctype(doctype, function() {
		const appage = frappe.ui.make_app_page({
			parent: $('#frappe-aspect-list'),
			title: doctype,
		});

		const list_view = new frappe.views.ListView({
			doctype: doctype,
			parent: appage.parent,
			page_length: 20,
		});

		const _after_render = list_view.after_render.bind(list_view);
		list_view.after_render = function() {
			_after_render();
			bind_list_item_click_event();
			hide_sidebar_and_chatter();
			set_aspect_heights();
			setup_resizable_pane();
		};

		list_view.show();
	});
}

function bind_list_item_click_event() {
	$('#frappe-aspect-list')
		.off('click.frappe_aspect', '.list-row')
		.on('click.frappe_aspect', '.list-row', function(event) {
			event.stopPropagation();
			event.preventDefault();
			event.stopImmediatePropagation();

			$('#frappe-aspect-list .list-row').removeClass('frappe-aspect-selected');
			$(event.currentTarget).addClass('frappe-aspect-selected');

			const link = $(event.currentTarget).find(".list-subject a").get(0);
			if (!link) return;
			const doctype = $(link).attr('data-doctype');
			const docname = $(link).attr('data-name');
			if (doctype && docname) {
				load_form_view(doctype, docname);
			}
		});
}

function load_form_view(doctype, docname) {
	const $form = $('#frappe-aspect-form');
	$form.children().not('#frappe-aspect-form-empty').remove();
	$form.addClass('has-doc');

	frappe.model.with_doctype(doctype, () => {
		frappe.model.with_doc(doctype, docname, () => {
			const form = new frappe.ui.form.Form(
				doctype,
				$form,
				true,
				frappe.router.doctype_layout
			);
			var super_refresh_header = form.refresh_header;
			form.refresh_header = function(switched) {
				super_refresh_header.apply(this, ...arguments);
				hide_sidebar_and_chatter();
			};
			form.refresh(docname);
			set_aspect_heights();
		});
	});
}

function hide_sidebar_and_chatter() {
	$('#frappe-aspect-list > .page-head').hide();
	$('#frappe-aspect-list .layout-side-section').hide();
	$('#frappe-aspect-form .layout-side-section').hide();
	$('#frappe-aspect-form > .page-head .standard-actions .prev-doc').hide();
	$('#frappe-aspect-form > .page-head .standard-actions .next-doc').hide();
}
