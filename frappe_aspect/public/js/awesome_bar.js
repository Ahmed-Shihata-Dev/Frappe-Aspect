frappe.provide("frappe.search");

var super_build_option = frappe.search.AwesomeBar.build_options;
frappe.search.AwesomeBar = class extends frappe.search.AwesomeBar {
    build_options(txt) {
        // Call the original build_options method
        const options = super.build_options(txt);

        // Filter out 'frappe_aspect' related content from the options
        const filteredOptions = options.filter(option => {
            // Modify the condition based on your requirements
            // Here, we're assuming 'frappe_aspect' is part of the value property
            return !(option.value.includes("Frappe Aspect") || option.value.includes("frappe_aspect"));
        });

        return filteredOptions;
    }
};