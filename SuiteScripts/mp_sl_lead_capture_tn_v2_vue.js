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


define(['N/ui/serverWidget', 'N/render', 'N/search', 'N/file'], (serverWidget, render, search, file) => {
    nServerWidget = serverWidget;
    nSearch = search;
    nRender = render;
    nFile = file;

    
    const onRequest = ({request, response}) => {
        if (request.method === "GET") {

            if (parseInt(request.parameters.testMode) === 1)
                htmlTemplateFile = 'mp_cl_lead_capture_tn_v2_vue_test.html'


            // Render the page using either inline form or standalone page
            // _getStandalonePage(response)
            _getInlineForm(response)

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