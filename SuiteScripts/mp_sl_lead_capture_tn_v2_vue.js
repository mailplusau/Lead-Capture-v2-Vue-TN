// noinspection JSCheckFunctionSignatures

/**
 * @author Tim Nguyen
 * @description NetSuite Experimentation - Lead Capture v2 with Vue 3
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @created 27/02/2023
 */

// This should be the same file as the one built by webpack. Make sure this matches the filename in package.json
let htmlTemplateFile = 'mp_cl_lead_capture_tn_v2_vue.html';

let nServerWidget, nRecord, nSearch, nRender, nFile;


define(['N/ui/serverWidget', 'N/render', 'N/record', 'N/search', 'N/file', 'N/log'], (serverWidget, render, record, search, file, log) => {
    nServerWidget = serverWidget;
    nSearch = search;
    nRender = render;
    nFile = file;
    nRecord = record;

    
    const onRequest = ({request, response}) => {
        if (request.method === "GET") {

            // if testMode param is present, we load the alternative html template. for testing and dev work only.
            // if (parseInt(request.parameters['testMode']) === 1)
            //     htmlTemplateFile = 'mp_cl_lead_capture_tn_v2_vue_test.html'

            if (!_handleDataRequests(request.parameters['requestData'], response)){
                // Render the page using either inline form or standalone page
                // _getStandalonePage(response)
                _getInlineForm(response)
            }

        } else { // Request method should be POST (?)
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
    // Create a NetSuite form
    let form = nServerWidget.createForm({ title: "Prospect Capture Form" });

    // Then create form field in which we will render our html template
    let htmlField = form.addField({
        id: "custpage_html",
        label: "html",
        type: nServerWidget.FieldType.INLINEHTML,
    });
    
    const pageRenderer = nRender.create();
    const htmlFileData = _getHtmlTemplate(htmlTemplateFile);
    const htmlFile = nFile.load({ id: htmlFileData[htmlTemplateFile].id });
    pageRenderer.templateContent = htmlFile.getContents();
    htmlField.defaultValue = pageRenderer.renderAsString();

    // Retrieve client script Id using its file name.
    const clientScriptFilename = 'mp_cl_lead_capture_tn_v2_vue.js';
    form.clientScriptFileId = _getHtmlTemplate(clientScriptFilename)[clientScriptFilename].id;

    response.writePage(form);
}

// Render the htmlTemplateFile as a standalone page without any of NetSuite's baggage. However, this also means no
// NetSuite module will be exposed to the Vue app. Thus, an api approach using Axios and structuring this Suitelet as
// a http request handler will be necessary. For reference:
// https://medium.com/@vladimir.aca/how-to-vuetify-your-suitelet-on-netsuite-part-2-axios-http-3e8e731ac07c
function _getStandalonePage(response) {
    // Create renderer to render our html template
    const pageRenderer = nRender.create();

    // Get the id and url of our html template file
    const htmlFileData = _getHtmlTemplate(htmlTemplateFile);

    // Load the  html file and store it in htmlFile
    const htmlFile = nFile.load({
        id: htmlFileData[htmlTemplateFile].id
    });

    // Load the content of the html file into the renderer
    pageRenderer.templateContent = htmlFile.getContents();

    response.write(pageRenderer.renderAsString());
}

// Search for the ID and URL of a given file name inside the NetSuite file cabinet
function _getHtmlTemplate(htmlPageName) {
    const htmlPageData = {};

    nSearch.create({
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



function _handleDataRequests(request, response) {
    if (!request) return false;

    try {
        let {operation, data} = JSON.parse(request);

        if (!operation) throw 'No operation specified.';

        operations[operation](response, data);
    } catch (e) {
        _writeResponseJson(response, {error: e})
    }

    return true;
}


function _writeResponseJson(response, body) {
    response.write({ output: JSON.stringify(body) });
    response.addHeader({
        name: 'Content-Type',
        value: 'application/json; charset=utf-8'
    });
}


const operations = {
    'userNotesSearch': function (response, {customerId}) {
        if (!customerId) throw 'No Customer ID specified.';

        let notes = [];
        nSearch.create({
            type: nSearch.Type.NOTE,
            filters: [
                nSearch.createFilter({
                    name: 'internalid',
                    join: 'CUSTOMER',
                    operator: nSearch.Operator.IS,
                    values: customerId
                })
            ],
            columns: [
                nSearch.createColumn({name: "note", label: "Memo"}),
                nSearch.createColumn({name: "author", label: "Author"}),
                nSearch.createColumn({name: "notedate", label: "Date"})
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
    'getEmployeeEmail': function (response, {employeeId}) {
        if (!employeeId) throw 'No Employee ID specified.';

        let employeeRecord = nRecord.load({type: 'employee', id: employeeId});

        _writeResponseJson(response, employeeRecord.getValue({fieldId: 'email'}));
    },
    'testSearch' : function (response) {
        let search = nSearch;
        let data = [];

        let serviceSearch = search.load({
            id: 'customsearch3745',
            type: 'noninventoryitem'
        });

        serviceSearch.filters = [
            search.createFilter({
                name: 'custitem_carrier',
                operator: 'anyof',
                values: 2
            }),
            search.createFilter({
                name: 'custitem_product_weight',
                operator: 'anyof',
                values: 5
            }),
            search.createFilter({
                name: 'custitem_price_plans',
                operator: 'anyof',
                values: 15
            }),
        ]

        // serviceSearch.filters.push(
        //     search.createFilter({
        //         name: 'custitem_item_zones',
        //         operator: 'anyof',
        //         values: 1
        //     }),
        //     search.createFilter({
        //         name: 'custitem_item_receiver_zones',
        //         operator: 'anyof',
        //         values: 1
        //     }),
        // )

        serviceSearch.run().each(function (item) {
            data.push(item.getValue('internalid'));

            return true;
        });

        _writeResponseJson(response, data);
    },
    'createProductPricing' : function (response, {customerId, city, postcode}) {
        let customerRecord = nRecord.load({type: nRecord.Type.CUSTOMER, id: customerId});
        let partnerId = customerRecord.getValue({fieldId: 'partner'});
        let partnerRecord = nRecord.load({type: 'partner', id: partnerId});

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

            let standardProductPricingRecord = nRecord.create({type: 'customrecord_product_pricing'});
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

            let expressProductPricingRecord = nRecord.create({type: 'customrecord_product_pricing'});
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

        _writeResponseJson(response, 'Product pricing created');
    }
}

function _getNSZoneId(city, postcode) {
    let search = nSearch;

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
    let search = nSearch;
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