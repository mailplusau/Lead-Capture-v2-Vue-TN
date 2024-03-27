// noinspection JSCheckFunctionSignatures

/**
 * @author Tim Nguyen
 * @description NetSuite Experimentation - Lead Capture v2 with Vue 3
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @created 27/02/2023
 */

// Surcharge rates according to https://mailplus.com.au/surcharge/
const fuelSurcharge = {
    express: process.env.VUE_APP_NS_EXPRESS_FUEL_SURCHARGE, // custentity_mpex_surcharge_rate
    standard: process.env.VUE_APP_NS_STANDARD_FUEL_SURCHARGE, // custentity_sendle_fuel_surcharge
    service: process.env.VUE_APP_NS_SERVICE_FUEL_SURCHARGE, // custentity_service_fuel_surcharge_percen
}

import {VARS} from '@/utils/utils.mjs';
import {baseURL} from '@/utils/utils.mjs';

// This should be the same file as the one built by webpack. Make sure this matches the filename in package.json
let htmlTemplateFile = 'mp_cl_lead_capture_tn_v2_vue.html';
const clientScriptFilename = 'mp_cl_lead_capture_tn_v2_vue.js';
const defaultTitle = 'Lead Capture';

let NS_MODULES = {};

// eslint-disable-next-line no-undef
define(['N/ui/serverWidget', 'N/render', 'N/search', 'N/file', 'N/log', 'N/record', 'N/email', 'N/runtime', 'N/https', 'N/task', 'N/format', 'N/url', 'N/encode'],
    (serverWidget, render, search, file, log, record, email, runtime, https, task, format, url, encode) => {
        NS_MODULES = {serverWidget, render, search, file, log, record, email, runtime, https, task, format, url, encode};

        const onRequest = ({request, response}) => {
            if (request.method === "GET") {

                if (!_handleGETRequests(request.parameters['requestData'], response)){
                    // Render the page using either inline form or standalone page
                    // _getStandalonePage(response)
                    _getInlineForm(response)
                }

            } else if (request.method === "POST") { // Request method should be POST (?)
                _handlePOSTRequests(JSON.parse(request.body), response);
                // _writeResponseJson(response, {test: 'test response from post', params: request.parameters, body: request.body});
            } else {
                log.debug({
                    title: "request method type",
                    details: `method : ${request.method}`,
                });
            }

        }

        return {onRequest};
    });

// Render the page within a form element of NetSuite. This can cause conflict with NetSuite's stylesheets.
function _getInlineForm(response) {
    let {serverWidget} = NS_MODULES;

    // Create a NetSuite form
    let form = serverWidget.createForm({ title: defaultTitle });

    // Retrieve client script ID using its file name.
    form.clientScriptFileId = _getHtmlTemplate(clientScriptFilename)[clientScriptFilename].id;

    response.writePage(form);
}

// Search for the ID and URL of a given file name inside the NetSuite file cabinet
function _getHtmlTemplate(htmlPageName) {
    let {search} = NS_MODULES;

    const htmlPageData = {};

    search.create({
        type: 'file',
        filters: ['name', 'is', htmlPageName],
        columns: ['name', 'url']
    }).run().each(resultSet => {
        htmlPageData[resultSet.getValue({ name: 'name' })] = {
            url: resultSet.getValue({ name: 'url' }),
            id: resultSet.id
        };
        return true;
    });

    return htmlPageData;
}


function _handleGETRequests(request, response) {
    if (!request) return false;

    let {log} = NS_MODULES;

    try {
        let {operation, requestParams} = JSON.parse(request);

        if (!operation) throw 'No operation specified.';

        if (operation === 'getIframeContents') _getIframeContents(response);
        else if (!getOperations[operation]) throw `GET operation [${operation}] is not supported.`;
        else getOperations[operation](response, requestParams);
    } catch (e) {
        log.debug({title: "_handleGETRequests", details: `error: ${e}`});
        _writeResponseJson(response, {error: `${e}`})
    }

    return true;
}

function _handlePOSTRequests({operation, requestParams}, response) {
    let {log} = NS_MODULES;

    try {
        if (!operation) throw 'No operation specified.';

        // _writeResponseJson(response, {source: '_handlePOSTRequests', operation, requestParams});
        postOperations[operation](response, requestParams);
    } catch (e) {
        log.debug({title: "_handlePOSTRequests", details: `error: ${e}`});
        _writeResponseJson(response, {error: `${e}`})
    }
}

function _writeResponseJson(response, body) {
    response.write({ output: JSON.stringify(body) });
    response.addHeader({
        name: 'Content-Type',
        value: 'application/json; charset=utf-8'
    });
}

function _getIframeContents(response) {
    const htmlFileData = _getHtmlTemplate(htmlTemplateFile);
    const htmlFile = NS_MODULES.file.load({ id: htmlFileData[htmlTemplateFile].id });

    _writeResponseJson(response, htmlFile.getContents());
}

const getOperations = {
    'getCurrentUserDetails' : function (response) {
        let user = {role: NS_MODULES.runtime['getCurrentUser']().role, id: NS_MODULES.runtime['getCurrentUser']().id};
        let salesRep = {};

        if (parseInt(user.role) === 1000) {
            let franchiseeRecord = NS_MODULES.record.load({type: 'partner', id: user.id});
            let employeeId = franchiseeRecord.getValue({fieldId: 'custentity_sales_rep_assigned'});
            let employeeRecord = NS_MODULES.record.load({type: 'employee', id: employeeId});
            salesRep['id'] = employeeId;
            salesRep['name'] = `${employeeRecord.getValue({fieldId: 'firstname'})} ${employeeRecord.getValue({fieldId: 'lastname'})}`;
        }

        _writeResponseJson(response, {...user, salesRep});
    },
    'getCustomerDetails': function (response, {customerId, fieldIds, includesFranchisee = false}) {
        if (!customerId) return _writeResponseJson(response, {error: `Invalid Customer ID: ${customerId}`});

        if (includesFranchisee) {
            let {record} = NS_MODULES;
            let customerData = {}, franchiseeData = {};

            let customerRecord = record.load({type: 'customer', id: customerId});
            let partnerRecord = record.load({type: 'partner', id: customerRecord.getValue({fieldId: 'partner'})});

            for (let fieldId of fieldIds) {
                customerData[fieldId] = customerRecord.getValue({fieldId});
                customerData[fieldId + '_text'] = customerRecord.getText({fieldId});
            }

            for (let fieldId in VARS.franchisee.basicFields) {
                franchiseeData[fieldId] = partnerRecord.getValue({fieldId});
                franchiseeData[fieldId + '_text'] = partnerRecord.getText({fieldId});
            }

            _writeResponseJson(response, {franchiseeData, customerData});
        } else
            _writeResponseJson(response, sharedFunctions.getCustomerData(customerId, fieldIds));
    },
    'getCustomerAddresses' : function (response, {customerId}) {
        let {record} = NS_MODULES;
        let data = [];
        let fieldIds = ['addr1', 'addr2', 'city', 'state', 'zip', 'country', 'addressee', 'custrecord_address_lat', 'custrecord_address_lon', 'custrecord_address_ncl'];
        let sublistFieldIds = ['internalid', 'label', 'defaultshipping', 'defaultbilling', 'isresidential'];

        if (!customerId) return _writeResponseJson(response, {error: `Invalid Customer ID: ${customerId}`});

        let customerRecord = record.load({
            type: record.Type.CUSTOMER,
            id: customerId,
            isDynamic: true
        });

        let lineCount = customerRecord.getLineCount({sublistId: 'addressbook'});

        for (let line = 0; line < lineCount; line++) {
            customerRecord.selectLine({sublistId: 'addressbook', line});
            let entry = {};

            for (let fieldId of sublistFieldIds) {
                entry[fieldId] = customerRecord.getCurrentSublistValue({sublistId: 'addressbook', fieldId})
            }

            let addressSubrecord = customerRecord.getCurrentSublistSubrecord({sublistId: 'addressbook', fieldId: 'addressbookaddress'});
            for (let fieldId of fieldIds) {
                entry[fieldId] = addressSubrecord.getValue({ fieldId })
            }

            data.push(entry);
        }

        _writeResponseJson(response, data);
    },
    'getCustomerContacts' : function (response, {customerId}) {
        if (!customerId) return _writeResponseJson(response, {error: `Invalid Customer ID: ${customerId}`});

        _writeResponseJson(response, sharedFunctions.getCustomerContacts(customerId));
    },
    'getSelectOptions' : function (response, {id, type, valueColumnName, textColumnName}) {
        let {search} = NS_MODULES;
        let data = [];

        search.create({
            id, type,
            filters: ['isinactive', 'is', false],
            columns: [{name: valueColumnName}, {name: textColumnName}]
        }).run().each(result => {
            data.push({value: result.getValue(valueColumnName), text: result.getValue(textColumnName)});
            return true;
        });

        _writeResponseJson(response, data);
    },
    'getFranchiseeOfCustomer' : function (response, {customerId}) {
        let partnerId = '';
        try {
            let result = NS_MODULES.search.lookupFields({
                type: NS_MODULES.search.Type.CUSTOMER,
                id: customerId,
                columns: ['partner']
            });

            partnerId = result.partner ? result.partner[0].value : '';
        } catch (e) {
            //
        }
        _writeResponseJson(response, partnerId);
    },
    'getPostalLocationOptions' : function (response, {postalStateId}) {
        let {search} = NS_MODULES;
        let data = [];
        let postalLocationForm = [
            'name',
            'internalid',
            'custrecord_ap_lodgement_addr1',
            'custrecord_ap_lodgement_addr2',
            'custrecord_ap_lodgement_lat',
            'custrecord_ap_lodgement_long',
            'custrecord_ap_lodgement_postcode',
            'custrecord_ap_lodgement_site_phone',
            'custrecord_ap_lodgement_site_state', // getText for this one
            'custrecord_ap_lodgement_suburb',
            'custrecord_ap_lodgement_supply',
            'custrecord_ncl_monthly_fee',
            'custrecord_ncl_site_access_code',
            'custrecord_noncust_location_type', // getText for this one too
        ];

        let NCLSearch = search.load({
            type: 'customrecord_ap_lodgment_location',
            id: 'customsearch_smc_noncust_location'
        });

        //NCL Type: AusPost(1), Toll(2), StarTrack(7)
        NCLSearch.filters.push(search.createFilter({
            name: 'custrecord_noncust_location_type',
            operator: search.Operator.ANYOF,
            values: [1, 2, 7]
        }))

        NCLSearch.filters.push(search.createFilter({
            name: 'custrecord_ap_lodgement_site_state',
            operator: search.Operator.IS,
            values: postalStateId,
        }))

        let results = NCLSearch.run();

        let temp = 0;
        while (temp < 5) {
            let subset = results.getRange({start: temp * 1000, end: temp * 1000 + 1000});
            for (let postalLocation of subset) { // we can also use getAllValues() on one of these to see all available fields
                let entry = {};
                for (let fieldId of postalLocationForm) {
                    if (['custrecord_noncust_location_type', 'custrecord_ap_lodgement_site_state'].includes(fieldId)) {
                        entry[fieldId] = postalLocation.getText({name: fieldId});
                    } else entry[fieldId] = postalLocation.getValue({name: fieldId});
                }
                data.push(entry);
            }
            if (subset.length < 1000) break;
            temp++;
        }

        _writeResponseJson(response, data);
    },
    'getInvoices' : function (response, {customerId, invoiceStatus, invoicePeriod}) {
        let { search, format } = NS_MODULES;
        let data = [];

        let invoicesSearch = search.load({
            id: 'customsearch_mp_ticket_invoices_datatabl',
            type: search.Type.INVOICE
        });
        let invoicesFilterExpression = invoicesSearch.filterExpression;
        invoicesFilterExpression.push('AND', ['entity', search.Operator.IS, customerId]);

        invoicesFilterExpression.push('AND', ["status", search.Operator.ANYOF, invoiceStatus]);

        invoicesFilterExpression.push('AND', ["trandate", search.Operator.AFTER,
            format.format({
                value: invoicePeriod,
                type: format.Type.DATE
            })
        ]);

        invoicesSearch.filterExpression = invoicesFilterExpression;
        let invoicesSearchResults = invoicesSearch.run();

        let fieldIds = ['statusref', 'trandate', 'invoicenum', 'amountremaining', 'total', 'duedate'];
        invoicesSearchResults.each(function (invoiceResult) {
            let tmp = {};

            for (let fieldId of fieldIds)
                tmp[fieldId] = invoiceResult.getValue(fieldId);

            tmp['status_text'] = invoiceResult.getText('statusref');
            tmp['invoice_type'] = invoiceResult.getText('custbody_inv_type');
            tmp['id'] = invoiceResult.id;

            data.push(tmp);

            return true;
        });

        _writeResponseJson(response, data);
    },
    'getAssignedServices' : function (response, {customerId}) {
        let {search} = NS_MODULES;
        let data = [];

        let serviceSearch = search.load({
            id: 'customsearch_salesp_services',
            type: 'customrecord_service'
        });

        serviceSearch.filters.push(search.createFilter({
            name: 'custrecord_service_customer',
            operator: search.Operator.ANYOF,
            values: customerId
        }));

        let resultSetServices = serviceSearch.run();

        resultSetServices.each(function (item) {
            let tmp = {};

            for (let column of item.columns) {
                tmp[column.name] = item.getValue(column);
                tmp[column.name + '_text'] = item.getText(column);
            }

            data.push(tmp);

            return true;
        });

        _writeResponseJson(response, data);
    },
    'getItemPricing' : function (response, {customerId}) {
        let data = [];

        let customerRecord = NS_MODULES.record.load({
            type: NS_MODULES.record.Type.CUSTOMER,
            id: customerId,
            isDynamic: true
        });

        let lineCount = customerRecord.getLineCount({sublistId: 'itempricing'});

        for (let line = 0; line < lineCount; line++) {
            data.push({
                name: customerRecord.getSublistText({
                    sublistId: 'itempricing',
                    fieldId: 'item',
                    line
                }),
                price: customerRecord.getSublistValue({
                    sublistId: 'itempricing',
                    fieldId: 'price',
                    line
                })
            })
        }

        _writeResponseJson(response, data);
    },
    'getProductPricing' : function (response, {customerId}) {
        let {search} = NS_MODULES;
        let data = [];

        let searchProductPricing = search.load({
            id: 'customsearch_prod_pricing_customer_level',
            type: 'customrecord_product_pricing'
        });

        searchProductPricing.filters.push(search.createFilter({
            name: 'custrecord_prod_pricing_customer',
            join: null,
            operator: 'anyof',
            values: customerId,
        }));

        searchProductPricing.run().each(item => {
            let tmp = {};

            for (let column of item.columns) {
                tmp[column.name] = item.getValue(column);
                tmp[column.name + '_text'] = item.getText(column);
            }

            data.push(tmp);

            return true;
        })

        _writeResponseJson(response, data);
    },
    'getMpExWeeklyUsage' : function (response, {customerId}) {
        let {search} = NS_MODULES;
        let data = [];

        let customerSearch = search.load({
            id: 'customsearch_customer_mpex_weekly_usage',
            type: 'customer'
        });

        customerSearch.filters.push(search.createFilter({
            name: 'internalid',
            operator: search.Operator.IS,
            values: customerId
        }));

        customerSearch.run().each(item => {
            let weeklyUsage = item.getValue('custentity_actual_mpex_weekly_usage');

            let parsedUsage = JSON.parse(weeklyUsage);

            for (let x = 0; x < parsedUsage['Usage'].length; x++) {
                let parts = parsedUsage['Usage'][x]['Week Used'].split('/');

                data.push({
                    col1: parts[2] + '-' + ('0' + parts[1]).slice(-2) + '-' + ('0' + parts[0]).slice(-2),
                    col2: parsedUsage['Usage'][x]['Count']
                })
            }

            return true;
        })

        _writeResponseJson(response, data);
    },
    'getUserNotes': function (response, {customerId}) {
        if (!customerId) throw 'No Customer ID specified.';

        let {search} = NS_MODULES;
        let notes = [];

        search.create({
            type: search.Type.NOTE,
            filters: [
                search.createFilter({
                    name: 'internalid',
                    join: 'CUSTOMER',
                    operator: search.Operator.IS,
                    values: customerId
                })
            ],
            columns: [
                search.createColumn({name: "note", label: "Memo"}),
                search.createColumn({name: "author", label: "Author"}),
                search.createColumn({name: "notedate", label: "Date"})
            ]
        }).run().each(item => {
            let note_date = item.getValue('notedate');
            let author = item.getText('author');
            let message = item.getValue('note');

            notes.push({note_date, author, message});

            return true;
        })

        _writeResponseJson(response, notes)
    },
}

const postOperations = {
    'saveCustomerDetails' : function (response, {customerId, customerData, fieldIds}) {
        sharedFunctions.saveCustomerData(customerId, customerData);

        _writeResponseJson(response, sharedFunctions.getCustomerData(customerId, fieldIds));
    },
    'saveAddress' : function (response, {customerId, addressArray}) {
        for (let addressData of addressArray)
            sharedFunctions.saveCustomerAddress(customerId, addressData);

        _writeResponseJson(response, 'Address Saved!');
    },
    'deleteAddress' : function (response, {customerId, addressInternalId}) {
        let {record} = NS_MODULES;

        let customerRecord = record.load({
            type: record.Type.CUSTOMER,
            id: customerId,
        });
        let line = customerRecord.findSublistLineWithValue({sublistId: 'addressbook', fieldId: 'internalid', value: addressInternalId});

        customerRecord.removeLine({sublistId: 'addressbook', line});

        customerRecord.save({ignoreMandatoryFields: true});

        _writeResponseJson(response, 'Address Deleted!');
    },
    'saveContact' : function (response, {contactData}) {
        if (!contactData) return _writeResponseJson(response, {error: `Missing params [contactData]: ${contactData}`});

        sharedFunctions.saveCustomerContact(null, contactData);

        _writeResponseJson(response, 'Contact Saved!');
    },
    'setContactAsInactive' : function (response, {contactInternalId}) {
        if (!contactInternalId) return _writeResponseJson(response, {error: `Missing params [contactInternalId]: ${contactInternalId}`});

        let {record} = NS_MODULES;

        let contactRecord = record.load({
            type: record.Type.CONTACT,
            id: contactInternalId,
        });

        contactRecord.setValue({fieldId: 'isinactive', value: true});

        contactRecord.save({ignoreMandatoryFields: true});

        _writeResponseJson(response, 'Contact Delete!');
    },
    'createUserNote' : function (response, {customerId, noteData}) {
        _writeResponseJson(response, sharedFunctions.createUserNote(customerId, NS_MODULES.runtime['getCurrentUser']().id, noteData));
    },

    'saveBrandNewCustomer' : function (response, {customerData, addressArray, contactArray}) {
        // Data preparation
        // Set default fuel surcharges
        customerData['custentity_service_fuel_surcharge'] = 1;
        customerData['custentity_mpex_surcharge'] = 1;
        customerData['custentity_service_fuel_surcharge_percen'] = fuelSurcharge.service;
        customerData['custentity_mpex_surcharge_rate'] = fuelSurcharge.express;
        customerData['custentity_sendle_fuel_surcharge'] = fuelSurcharge.standard;

        customerData['custentity_email_service'] = customerData['custentity_email_service'] || 'abc@abc.com';
        customerData['phone'] = customerData['phone'] || '1300656595';
        customerData['partner'] = customerData['partner'] || 435; // MailPlus Pty Ltd (435)

        customerData['custentity_invoice_method'] = 2; // Invoice method: Email (2) (default)
        customerData['custentity18'] = true; // Exclude from batch printing
        customerData['custentity_invoice_by_email'] = true; // Invoice by email
        customerData['custentity_mpex_small_satchel'] = 1; // Activate MP Express Pricing

        if (NS_MODULES.runtime['getCurrentUser']().role !== 1000) // only set this field when the user is not a franchisee
            customerData['custentity_lead_entered_by'] = NS_MODULES.runtime['getCurrentUser']().id;

        // Save customer's detail
        let customerId = sharedFunctions.saveCustomerData(null, customerData);

        // Take the field custentity_operation_notes and create a User Note to make it easier for sales team to see.
        if (customerData['custentity_operation_notes']) // only do this if the field exist
            sharedFunctions.createUserNote(customerId, NS_MODULES.runtime['getCurrentUser']().id, {
                // the 3 following fields will be autofilled
                entity: null, // Customer ID that this belongs to
                notedate: null, // Date Create
                author: null, // Author of this note

                direction: 1, // Incoming (1)
                notetype: 7, // Note (7)
                note: customerData['custentity_operation_notes'], // Message in the note
                title: 'Note from franchisee', // Note's title
            })

        // Save address
        for (let addressData of addressArray)
            sharedFunctions.saveCustomerAddress(customerId, {...addressData, internalid: null});

        // Save contact
        for (let contactData of contactArray)
            sharedFunctions.saveCustomerContact(customerId, {...contactData, internalid: null});

        // Create product pricing
        let addressIndex = addressArray.findIndex(item => item.label === 'Site Address');
        let address = addressArray[addressIndex];
        if (address) _createProductPricing(customerId, address.city, address.zip);

        // _sendEmailToSalesRep(customerId);

        _writeResponseJson(response, customerId);
    },
    'uploadImage' : function (response, {base64FileContent, fileName}) {
        if (base64FileContent && fileName) {
            let {file} = NS_MODULES;
            let fileExtension = fileName.split('.').pop().toLowerCase();
            let extensionList = {
                png: file.Type['PNGIMAGE'],
                jpg: file.Type['JPGIMAGE'],
                jpeg: file.Type['JPGIMAGE'],
                bmp: file.Type['BMPIMAGE'],
                tiff: file.Type['TIFFIMAGE'],
                gif: file.Type['GIFIMAGE'],
            };

            if (extensionList[fileExtension]) {
                file.create({
                    name: fileName,
                    fileType: extensionList[fileExtension],
                    contents: base64FileContent,
                    folder: 3819984, // New Lead Photos folder
                }).save();

                _writeResponseJson(response, 'file uploaded');
            } else _writeResponseJson(response, {error: `Extension [${fileExtension}] not support. `});
        } else _writeResponseJson(response, {error: `no data provided`});
    }
};

const sharedFunctions = {
    getCustomerData(customerId, fieldIds) {
        let {record} = NS_MODULES;
        let data = {};

        let customerRecord = record.load({
            type: record.Type.CUSTOMER,
            id: customerId,
        });

        for (let fieldId of fieldIds) {
            data[fieldId] = customerRecord.getValue({fieldId});
            data[fieldId + '_text'] = customerRecord.getText({fieldId});
        }

        return data;
    },
    getCustomerContacts(customerId) {
        let {search} = NS_MODULES;
        let contactForm = [
            'internalid',
            'salutation',
            'firstname',
            'lastname',
            'phone',
            'email',
            'contactrole',
            'title',
            'company',
            'entityid',
            'custentity_connect_admin',
            'custentity_connect_user',
        ];
        let data = [];

        let contactSearch = search.load({
            id: 'customsearch_salesp_contacts',
            type: 'contact'
        });

        contactSearch.filters.push(search.createFilter({
            name: 'internalid',
            join: 'CUSTOMER',
            operator: search.Operator.ANYOF,
            values: customerId
        }));

        contactSearch.filters.push(search.createFilter({
            name: 'isinactive',
            operator: search.Operator.IS,
            values: false
        }));

        let result = contactSearch.run();

        result.each((item) => {
            let contactEntry = {};

            for (let fieldId of contactForm) {
                contactEntry[fieldId] = item.getValue({ name: fieldId });
            }

            data.push(contactEntry);

            return true;
        });

        return data;
    },

    createUserNote(customerId, authorId, noteData) {
        let {record} = NS_MODULES;

        let userNoteRecord = record.create({
            type: record.Type['NOTE'],
        });

        noteData.entity = customerId;
        noteData.author = authorId;
        noteData.notedate = new Date();

        for (let fieldId in noteData)
            userNoteRecord.setValue({fieldId, value: noteData[fieldId]});

        return userNoteRecord.save({ignoreMandatoryFields: true});
    },
    saveCustomerData(id, data) {
        let {record} = NS_MODULES;
        let customerRecord;
        let isoStringRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;

        if (id) customerRecord = record.load({type: record.Type.CUSTOMER, id, isDynamic: true});
        else customerRecord = record.create({type: record.Type.LEAD}); // id not present, this is a new lead

        for (let fieldId in data)
            customerRecord.setValue({fieldId, value: isoStringRegex.test(data[fieldId]) ? new Date(data[fieldId]) : data[fieldId]});

        let customerId = customerRecord.save({ignoreMandatoryFields: true});

        if (data['custentity_old_customer']) { // update record of old customer if custentity_old_customer is specified
            let oldCustomerRecord = record.load({
                type: record.Type.CUSTOMER,
                id: data['custentity_old_customer'],
            });

            oldCustomerRecord.setValue({fieldId: 'custentity_new_customer', value: customerId});
            oldCustomerRecord.setValue({fieldId: 'custentity_new_zee', value: data['partner']});

            oldCustomerRecord.save({ignoreMandatoryFields: true});
        }

        return customerId;
    },
    saveCustomerAddress(customerId, addressData) {
        let {record} = NS_MODULES;

        let customerRecord = record.load({
            type: record.Type.CUSTOMER,
            id: customerId,
            isDynamic: true
        });

        // Safeguard against cases where country is blank which can prevent the record from being saved
        if (Object.hasOwnProperty.call(addressData, 'country') && !addressData['country'])
            addressData['country'] = 'AU';

        // Select an existing or create a new line the customerRecord's sublist
        if (addressData.internalid) { // Edit existing address
            let line = customerRecord.findSublistLineWithValue({sublistId: 'addressbook', fieldId: 'internalid', value: addressData.internalid});
            customerRecord.selectLine({sublistId: 'addressbook', line});
        } else { // Save new address
            customerRecord.selectNewLine({sublistId: 'addressbook'});
        }

        // Fill the sublist's fields using property names of VARS.addressSublistFields as reference
        for (let fieldId in VARS.addressSublistFields) {
            if (fieldId === 'internalid') continue; // we skip over internalid, not sure if this is necessary
            if (Object.hasOwnProperty.call(addressData, fieldId))
                customerRecord.setCurrentSublistValue({sublistId: 'addressbook', fieldId, value: addressData[fieldId]});
        }

        // Load the addressbookaddress subrecord of the currently selected sublist line
        let addressSubrecord = customerRecord.getCurrentSublistSubrecord({sublistId: 'addressbook', fieldId: 'addressbookaddress'});

        // Fill the subrecord's fields using property names of VARS.addressFields as reference
        for (let fieldId in VARS.addressFields)
            if (Object.hasOwnProperty.call(addressData, fieldId)) addressSubrecord.setValue({fieldId, value: addressData[fieldId]});

        // Commit the line
        customerRecord.commitLine({sublistId: 'addressbook'});

        // Save customer record
        customerRecord.save({ignoreMandatoryFields: true});
    },
    saveCustomerContact(customerId, contactData) {
        let {record} = NS_MODULES;
        let contactRecord;

        if (contactData.internalid) {
            contactRecord = record.load({
                type: record.Type.CONTACT,
                id: contactData.internalid,
                isDynamic: true
            });
        } else contactRecord = record.create({ type: record.Type.CONTACT });

        for (let fieldId in contactData)
            contactRecord.setValue({fieldId, value: contactData[fieldId]});

        if (customerId) contactRecord.setValue({fieldId: 'company', value: customerId});

        return contactRecord.save({ignoreMandatoryFields: true});
    }
};

function _createProductPricing(customerId, city, postcode) {
    if (!customerId || !city || !postcode)
        return NS_MODULES.log.debug({title: '_createProductPricing',
            details: `Null values. customerId: ${customerId}, city: ${city}, postcode: ${postcode}`});

    let {record} = NS_MODULES;
    let customerRecord = record.load({type: record.Type.CUSTOMER, id: customerId});
    let partnerId = customerRecord.getValue({fieldId: 'partner'});
    let partnerRecord = record.load({type: 'partner', id: partnerId});

    let standardActive = parseInt(partnerRecord.getValue({fieldId: 'custentity_zee_mp_std_activated'})) === 1;
    let expressActive = parseInt(partnerRecord.getValue({fieldId: 'custentity_zee_mp_exp_activated'})) === 1;

    let PRODUCTS = {
        W_5KG: 1,
        W_3KG: 2,
        W_1KG: 3,
        W_500G: 4,
        B4: 5,
        W_10KG: 8,
        W_25KG: 9,
        W_250G: 10,
        W_20KG: 11,
    }
    let nsZoneID = _getNSZoneId(city, postcode);

    if (standardActive) {
        let itemInternalstd250gID = _getProductId(5, PRODUCTS.W_250G, nsZoneID, 1, 13);
        let itemInternalstd500gID = _getProductId(5, PRODUCTS.W_500G, nsZoneID, 1, 13);
        let itemInternalstd1kgID = _getProductId(5, PRODUCTS.W_1KG, nsZoneID, 1, 13);
        let itemInternalstd3kgID = _getProductId(5, PRODUCTS.W_3KG, nsZoneID, 1, 13);
        let itemInternalstd5kgID = _getProductId(5, PRODUCTS.W_5KG, nsZoneID, 1, 13);
        let itemInternalstd10kgID = _getProductId(5, PRODUCTS.W_10KG, nsZoneID, 1, 13);
        let itemInternalstd20kgID = _getProductId(5, PRODUCTS.W_20KG, nsZoneID, 1, 13);
        let itemInternalstd25kgID = _getProductId(5, PRODUCTS.W_25KG, nsZoneID, 1, 13);

        let standardProductPricingRecord = record.create({type: 'customrecord_product_pricing'});
        standardProductPricingRecord.setValue({fieldId: 'custrecord_prod_pricing_last_update', value: new Date()});
        standardProductPricingRecord.setValue({fieldId: 'custrecord_prod_pricing_customer', value: customerId});
        standardProductPricingRecord.setValue({fieldId: 'custrecord_prod_pricing_delivery_speeds', value: 1});
        standardProductPricingRecord.setValue({fieldId: 'custrecord_prod_pricing_20kg', value: itemInternalstd20kgID});
        standardProductPricingRecord.setValue({fieldId: 'custrecord_prod_pricing_250g', value: itemInternalstd250gID});
        standardProductPricingRecord.setValue({fieldId: 'custrecord_prod_pricing_10kg', value: itemInternalstd10kgID});
        standardProductPricingRecord.setValue({fieldId: 'custrecord_prod_pricing_25kg', value: itemInternalstd25kgID});
        standardProductPricingRecord.setValue({fieldId: 'custrecord_prod_pricing_500g', value: itemInternalstd500gID});
        standardProductPricingRecord.setValue({fieldId: 'custrecord_prod_pricing_1kg', value: itemInternalstd1kgID});
        standardProductPricingRecord.setValue({fieldId: 'custrecord_prod_pricing_3kg', value: itemInternalstd3kgID});
        standardProductPricingRecord.setValue({fieldId: 'custrecord_prod_pricing_5kg', value: itemInternalstd5kgID});
        standardProductPricingRecord.setValue({fieldId: 'custrecord_prod_pricing_status', value: 2});
        standardProductPricingRecord.setValue({fieldId: 'custrecord_sycn_complete', value: 2});
        standardProductPricingRecord.setValue({fieldId: 'custrecord_prod_pricing_pricing_plan', value: 13});
        standardProductPricingRecord.save({ignoreMandatoryFields: true});
    }

    if (expressActive) {
        let itemInternalexpB4ID = _getProductId(2, PRODUCTS.B4, null, null, 15);
        let itemInternalexp500gID = _getProductId(2, PRODUCTS.W_500G, null, null, 15);
        let itemInternalexp1kgID = _getProductId(2, PRODUCTS.W_1KG, null, null, 15);
        let itemInternalexp3kgID = _getProductId(2, PRODUCTS.W_3KG, null, null, 15);
        let itemInternalexp5kgID = _getProductId(2, PRODUCTS.W_5KG, null, null, 15);

        let expressProductPricingRecord = record.create({type: 'customrecord_product_pricing'});
        expressProductPricingRecord.setValue({fieldId: 'custrecord_prod_pricing_last_update', value: new Date()});
        expressProductPricingRecord.setValue({fieldId: 'custrecord_prod_pricing_customer', value: customerId});
        expressProductPricingRecord.setValue({fieldId: 'custrecord_prod_pricing_delivery_speeds', value: 2});
        expressProductPricingRecord.setValue({fieldId: 'custrecord_prod_pricing_b4', value: itemInternalexpB4ID});
        expressProductPricingRecord.setValue({fieldId: 'custrecord_prod_pricing_500g', value: itemInternalexp500gID});
        expressProductPricingRecord.setValue({fieldId: 'custrecord_prod_pricing_1kg', value: itemInternalexp1kgID});
        expressProductPricingRecord.setValue({fieldId: 'custrecord_prod_pricing_3kg', value: itemInternalexp3kgID});
        expressProductPricingRecord.setValue({fieldId: 'custrecord_prod_pricing_5kg', value: itemInternalexp5kgID});
        expressProductPricingRecord.setValue({fieldId: 'custrecord_prod_pricing_status', value: 2});
        expressProductPricingRecord.setValue({fieldId: 'custrecord_sycn_complete', value: 2});
        expressProductPricingRecord.setValue({fieldId: 'custrecord_prod_pricing_pricing_plan', value: 15});
        expressProductPricingRecord.save({ignoreMandatoryFields: true});
    }

    try {
        // Create Premium Product Pricing
        let itemInternalPremium10kg = _getProductId(9, PRODUCTS.W_10KG, null, null, 17);
        let itemInternalPremium20kg = _getProductId(9, PRODUCTS.W_20KG, null, null, 17);
        let itemInternalPremium1kg = _getProductId(9, PRODUCTS.W_1KG, null, null, 17);
        let itemInternalPremium3kg = _getProductId(9, PRODUCTS.W_3KG, null, null, 17);
        let itemInternalPremium5kg = _getProductId(9, PRODUCTS.W_5KG, null, null, 17);

        let premiumProductPricingRecord = record.create({type: 'customrecord_product_pricing'});
        premiumProductPricingRecord.setValue({fieldId: 'custrecord_prod_pricing_last_update', value: new Date()});
        premiumProductPricingRecord.setValue({fieldId: 'custrecord_prod_pricing_customer', value: customerId});
        premiumProductPricingRecord.setValue({fieldId: 'custrecord_prod_pricing_delivery_speeds', value: 4});
        premiumProductPricingRecord.setValue({fieldId: 'custrecord_prod_pricing_10kg', value: itemInternalPremium10kg});
        premiumProductPricingRecord.setValue({fieldId: 'custrecord_prod_pricing_20kg', value: itemInternalPremium20kg});
        premiumProductPricingRecord.setValue({fieldId: 'custrecord_prod_pricing_1kg', value: itemInternalPremium1kg});
        premiumProductPricingRecord.setValue({fieldId: 'custrecord_prod_pricing_3kg', value: itemInternalPremium3kg});
        premiumProductPricingRecord.setValue({fieldId: 'custrecord_prod_pricing_5kg', value: itemInternalPremium5kg});
        premiumProductPricingRecord.setValue({fieldId: 'custrecord_prod_pricing_status', value: 2});
        premiumProductPricingRecord.setValue({fieldId: 'custrecord_sycn_complete', value: 2});
        premiumProductPricingRecord.setValue({fieldId: 'custrecord_prod_pricing_pricing_plan', value: 17});
        premiumProductPricingRecord.save({ignoreMandatoryFields: true});
    } catch (e) { NS_MODULES.log.error('_createProductPricing: Premium Product Pricing', e); }
}

function _getNSZoneId(city, postcode) {
    let {search} = NS_MODULES;
    let nsZoneID = 4;
    let serviceSearch = search.load({id: 'customsearch_sendle_dom_zones', type: 'customrecord_dom_zones'});

    serviceSearch.filters = [
        search.createFilter({name: 'custrecord_dom_zones_postcode', operator: 'is', values: postcode}),
        search.createFilter({name: 'custrecord_dom_zones_suburb_name', operator: 'is', values: city}),
    ];

    serviceSearch.run().each(function (item) {
        nsZoneID = parseInt(item.getValue('custrecord_dom_zones_ns_zones'));

        return true;
    });

    return nsZoneID;
}

function _getProductId(carrierId, productWeightId, nsZoneId, receiverZoneId, pricingPlanId) {
    let {search} = NS_MODULES;
    let productId = null;

    let serviceSearch = search.load({id: 'customsearch3745', type: 'noninventoryitem'});

    serviceSearch.filters = [
        search.createFilter({name: 'custitem_carrier', operator: 'anyof', values: carrierId}),
        search.createFilter({name: 'custitem_product_weight', operator: 'anyof', values: productWeightId}),
        search.createFilter({name: 'custitem_price_plans', operator: 'anyof', values: pricingPlanId}),
    ]

    if (nsZoneId)
        serviceSearch.filters
            .push(search.createFilter({name: 'custitem_item_zones', operator: 'anyof', values: nsZoneId}));

    if (receiverZoneId)
        serviceSearch.filters
            .push(search.createFilter({name: 'custitem_item_receiver_zones', operator: 'anyof', values: receiverZoneId}));

    serviceSearch.run().each(function (item) {
        productId = item.getValue('internalid');

        return true;
    });

    return productId;
}

function _sendEmailToSalesRep(customerId) {
    let {record, runtime} = NS_MODULES;
    let leadSourceToExclude = [
        231832, // Secure Cash
        217602, // Change of Entity
        202599, // Relocation
        34, // AusPost - Referral
        222553, // AusPost - Hub Transition
        222207, // AusPost Melbourne GPO List
        207048, // NeoPost
    ]

    // don't send if role is Admin or DataAdmin
    if ([3, 1032].includes(runtime['getCurrentUser']().role)) return;

    let customerRecord = record.load({type: 'customer', id: customerId});

    // don't send if lead source is in the exclusion list
    if (leadSourceToExclude.includes(parseInt(customerRecord.getValue({fieldId: 'leadsource'})))) return;

    let franchiseesNote = customerRecord.getValue({fieldId: 'custentity_operation_notes'});
    let customerStatus = parseInt(customerRecord.getValue({fieldId: 'entitystatus'}));

    let franchiseeRecord = record.load({type: 'partner', id: customerRecord.getValue({fieldId: 'partner'})});
    let employeeRecord = record.load({type: 'employee', id: customerRecord.getValue({fieldId: 'custentity_mp_toll_salesrep'})});

    let customerLink = 'https://1048144.app.netsuite.com/app/common/entity/custjob.nl?id=' + customerId;
    let customerName = customerRecord.getValue({fieldId: 'entityid'}) + ' ' + customerRecord.getValue({fieldId: 'companyname'});
    let emailBody = '';

    emailBody += 'A Hot Lead has been entered by franchisee ' + franchiseeRecord.getValue({fieldId: 'companyname'});
    emailBody += 'Customer Name: ' + customerName + '<br>';
    emailBody += '<a href="' + customerLink + '" target="_blank">' + customerLink + '</a><br><br>'
    emailBody += franchiseesNote ? `Franchisee's note: ${franchiseesNote}<br>` : '';

    if ([57, 6].includes(customerStatus)) { // Suspect - New (6) or Suspect - Hot Lead (57)
        // Change the recipient based on the status
        let subject = `Sales ${customerStatus === 57 ? 'HOT' : 'NEW'} Lead - Zee Generated - ${customerName}`;

        NS_MODULES.email.send({
            author: 112209,
            subject,
            body: emailBody,
            recipients: ['matthew.rajabi@mailplus.com.au'],
            cc: ['luke.forbes@mailplus.com.au', employeeRecord.getValue({fieldId: 'email'})],
            relatedRecords: {
                entityId: customerId
            }
        });
    }
}