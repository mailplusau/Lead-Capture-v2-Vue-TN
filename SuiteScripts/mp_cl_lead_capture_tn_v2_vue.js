/**
 * @author Tim Nguyen
 * @description NetSuite Experimentation - Lead Capture v2 with Vue 3. The only purpose of this script is to expose NetSuite modules to the Vue app.
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @created 27/02/2023
 */

let modules = {};

const moduleNames = ['error', 'runtime', 'search', 'record', 'url', 'format', 'email', 'currentRecord'];

// eslint-disable-next-line no-undef
define(moduleNames.map(item => 'N/' + item), (...args) => {
        for (let [index, moduleName] of moduleNames.entries())
            modules[moduleName] = args[index];

        function pageInit() {
            console.log('Client script init.');
            document.querySelector('h1.uir-record-type').innerHTML = 'Loading page. Please wait...';

            try {
                requestAppViaXMLHttpRequest();
            } catch (e) {
                console.error('requestAppViaXMLHttpRequest failed:', e);
                requestAppViaFetch();
            }
        }
        
        function requestAppViaXMLHttpRequest() {
            if (!document.querySelector('div#body')) return;
            console.log('attempting requestAppViaXMLHttpRequest...');

            let request = new XMLHttpRequest();

            request.onreadystatechange = function() {
                if (request.readyState === XMLHttpRequest.DONE) { // XMLHttpRequest.DONE === 4
                    if (request.status === 200) injectVueApp(JSON.parse(request.responseText))
                    else {
                        console.error('requestAppViaXMLHttpRequest failed with status', request.status)
                        requestAppViaFetch();
                    }
                }
            };

            request.open("GET", "scriptlet.nl?script=1706&deploy=1&requestData=%7B%22operation%22%3A%22getIframeContents%22%7D", true);
            request.send();
        }

        function requestAppViaFetch() {
            if (!document.querySelector('div#body')) return;
            console.log('attempting requestAppViaFetch...');

            let baseUrl = getCurrentNetSuiteUrl().split('?')[0];
            const params = new Proxy(new URLSearchParams(window.location.search), {
                get: (searchParams, prop) => searchParams.get(prop),
            });

            const paramsBuilder = new URLSearchParams({
                script: params['script'], deploy: params['deploy'],
                requestData: JSON.stringify({operation: 'getIframeContents'}),
            });

            fetch(baseUrl + '?' + paramsBuilder.toString(), {
                method: 'get'
            })
                .then(res => res.json())
                .then(jsonData => { injectVueApp(jsonData); })
                .catch(err => { console.error('requestAppViaFetch failed:', err); });
        }
        
        function injectVueApp(jsonData) {
            let iframe = document.createElement('iframe');
            iframe.id = 'body';
            iframe.srcdoc = jsonData;
            iframe.style.setProperty('border', 'none');
            document.querySelector('div#body').parentNode.insertBefore(iframe, null);
            document.querySelector('div#body').remove();
            setMPTheme();
        }

        return { pageInit };
    }
);

// eslint-disable-next-line no-unused-vars
function _getClientModules() {
    return modules;
}

function setMPTheme(pageTitle = '') {
    if (pageTitle) document.title = pageTitle;
}

function getCurrentNetSuiteUrl() {
    return location.href
}