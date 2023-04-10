/**
 * @author Tim Nguyen
 * @description NetSuite Experimentation - Lead Capture v2 with Vue 3
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @created 27/02/2023
 */

// This should be the same file as the one built by webpack. Make sure this matches the filename in package.json
let htmlTemplateFile = 'mp_cl_lead_capture_tn_v2_vue.html';

let nServerWidget, nSearch, nRender, nFile;


define(['N/ui/serverWidget', 'N/render', 'N/search', 'N/file', 'N/log'], (serverWidget, render, search, file, log) => {
    nServerWidget = serverWidget;
    nSearch = search;
    nRender = render;
    nFile = file;

    
    const onRequest = ({request, response}) => {
        if (request.method === "GET") {

            // if testMode param is present, we load the alternative html template. for testing and dev work only.
            if (parseInt(request.parameters['testMode']) === 1)
                htmlTemplateFile = 'mp_cl_lead_capture_tn_v2_vue_test.html'

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
    }
}