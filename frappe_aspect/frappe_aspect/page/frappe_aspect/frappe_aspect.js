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

    // Initially call the init_frappe_aspect to set up the page
    init_frappe_aspect(page);
    super_router_render = frappe.router.render;
    frappe.router.render = function(){
        $('#frappe-aspect-list').empty();
        $('#frappe-aspect-form').empty();
        super_router_render.apply(this, ...arguments);

    }
    // Set up route change listener
    frappe.router.on('change', function() {
        var route = frappe.get_route();
        if (route[0] === 'frappe_aspect') {
            var doctype = route[1];
            if (doctype) {
                page.set_title(doctype)
                init_list_view(doctype);
            }
        }
    });
};

function init_frappe_aspect(page) {
    page.custom_actions.removeClass('hide');
    $(frappe.render_template("frappeaspectactions", {})).appendTo(page.custom_actions);
    $(frappe.render_template("frappe_aspect", {})).appendTo(page.body);
    page.custom_actions.find('li').on('click', function() {
        switch_to_list_view();
        return false;
    });
    setTimeout(() => {
        $(".frappe-aspect-list").nresizable('destroy');
        $(".frappe-aspect-list").nresizable({
            handleSelector: ".o_frappe_aspect_splitter",
            resizeHeight: false,
            resizeWidth: true,
        });
    }, 1500);

    var route = frappe.get_route();
    if (route[0] === 'frappe_aspect') {
        var doctype = route[1];
        if (doctype) {
            init_list_view(doctype);
        }
    }
}

function switch_to_list_view(){
    let doctype = frappe.get_route()[1];
    frappe.set_route("List", doctype, "List");
}

async function init_list_view(doctype) {
    $('#frappe-aspect-list').empty();
    $('#frappe-aspect-form').empty();
    frappe.model.with_doctype(doctype, function() {
        var appage = frappe.ui.make_app_page({
            parent: $('#frappe-aspect-list'),
            title: 'Frappe Aspect (' + doctype + ')'
        });
        const list_view = new frappe.views.ListView({
            doctype: doctype,
            parent: appage.parent,
            page_length: 20
        });
        list_view.after_render = function(ev){
            bind_list_item_click_event();
            hide_sidebar_and_chatter();
        };
        list_view.show();
    });
}

function bind_list_item_click_event() {
    $('.list-row').off('click').on('click', function(event) {
        event.stopPropagation();
        event.preventDefault();
        event.stopImmediatePropagation();
        const link = $(event.currentTarget).find(".list-subject a").get(0);
        const doctype = $(link).attr('data-doctype');
        const docname = $(link).attr('data-name');
        load_form_view(doctype, docname);
    });
}

function load_form_view(doctype, docname) {
    $('#frappe-aspect-form').empty();
    frappe.model.with_doctype(doctype, () => {
        frappe.model.with_doc(doctype, docname, () => {
            const doc = frappe.get_doc(doctype, docname);
            const form = new frappe.ui.form.Form(
                doctype,
                $('#frappe-aspect-form'),
                true,
                frappe.router.doctype_layout
            );
            var super_refresh_header = form.refresh_header;
            form.refresh_header = function(switched){
                super_refresh_header.apply(this, ...arguments);
                hide_sidebar_and_chatter();
            };
            form.refresh(docname);
        });
    });
}

function hide_sidebar_and_chatter() {
    $("#frappe-aspect-list .page-head").hide();
    $('#frappe-aspect-list .layout-side-section').hide();
    $('#frappe-aspect-form .layout-side-section').hide();
    $('#frappe-aspect-form > .page-head .standard-actions .prev-doc').hide();
    $('#frappe-aspect-form > .page-head .standard-actions .next-doc').hide();
}