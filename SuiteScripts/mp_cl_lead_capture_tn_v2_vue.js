/**
 * @author Tim Nguyen
 * @description NetSuite Experimentation - Lead Capture v2 with Vue 3. The only purpose of this script is to expose NetSuite modules to the Vue app.
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @created 27/02/2023
 */

let modules = {};

// eslint-disable-next-line no-undef
define(['N/error', 'N/runtime', 'N/search', 'N/url', 'N/record', 'N/format','N/email', 'N/currentRecord'],
    (error, runtime, search, url, record, format, email, currentRecord) => {
        modules = {error, runtime, search, url, record, format, email, currentRecord};

        function pageInit() {
            console.log('Client script init.');
        }

        return { pageInit };
    }
);

// eslint-disable-next-line no-unused-vars
function _getClientModules() {
    return modules;
}