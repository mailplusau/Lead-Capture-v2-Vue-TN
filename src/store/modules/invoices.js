import getNSModules from '../../utils/ns-modules';
import moment from 'moment-timezone';
import 'moment/locale/en-au';

const state = {
    data: [
        // { "id": 4196554,"status_text": "Paid In Full", "invoice_type": "", "invoice_link": "#", "statusref": "paidInFull", "trandate": "31/12/2022", "invoicenum": "Invoice #INV1050668", "amountremaining": ".00", "total": "448.68", "duedate": "15/03/2023" },
        // { "id":4220468,"status_text": "Paid In Full", "invoice_type": "", "invoice_link": "#", "statusref": "paidInFull", "trandate": "31/01/2023", "invoicenum": "Invoice #INV1055261", "amountremaining": ".00", "total": "433.62", "duedate": "15/02/2023" },
        // { "id":4254837,"status_text": "Paid In Full", "invoice_type": "", "invoice_link": "#", "statusref": "paidInFull", "trandate": "28/02/2023", "invoicenum": "Invoice #INV1063976", "amountremaining": ".00", "total": "403.51", "duedate": "21/01/2024" }
    ],
    loading: false,
    status: null,
    statuses: [
        {value: null, text: '-- None --'},
        {value: 'CustInvc:A', text: 'Open Invoices'},
        {value: 'CustInvc:B', text: 'Paid In Full'}
    ],
    period: null,
    periods: [
        {value: null, text: '-- None --'},
        {
            value: moment().tz('Australia/Sydney').subtract(7, 'days').format('DD/MM/YYYY').toString(),
            text: 'Last 7 Days'
        },
        {
            value: moment().tz('Australia/Sydney').subtract(1, 'months').format('DD/MM/YYYY').toString(),
            text: 'Last Month'
        },
        {
            value: moment().tz('Australia/Sydney').subtract(3, 'months').format('DD/MM/YYYY').toString(),
            text: 'Last 3 Months'
        },
        {
            value: moment().tz('Australia/Sydney').subtract(6, 'months').format('DD/MM/YYYY').toString(),
            text: 'Last 6 Months'
        },
    ]
};

const getters = {
    all : state => state.data,
    loading : state => state.loading,
    status : state => state.status,
    statuses : state => state.statuses,
    period : state => state.period,
    periods : state => state.periods,
    showInvoicesSection : (state) => {
        return !!state.internalId;
    },
};

const mutations = {
    setStatus : (state, status) => { state.status = status; },
    setPeriod : (state, period) => { state.period = period; },
};

const actions = {
    getInvoices : async context => {
        if (!context.rootGetters['customer/internalId'] || !context.state.status || !context.state.period || context.rootState.errorNoNSModules)
            return;

        console.log('getting invoices...');
        context.state.loading = true;

        setTimeout(async () => {
            let { search, format } = await getNSModules();
            let invoicesSearch = search.load({
                id: 'customsearch_mp_ticket_invoices_datatabl',
                type: search.Type.INVOICE
            });
            let invoicesFilterExpression = invoicesSearch.filterExpression;
            invoicesFilterExpression.push('AND', ['entity', search.Operator.IS,
                context.rootGetters['customer/internalId']
            ]);

            invoicesFilterExpression.push('AND', ["status", search.Operator.ANYOF,
                context.state.status
            ]);

            invoicesFilterExpression.push('AND', ["trandate", search.Operator.AFTER,
                format.format({
                    value: context.state.period,
                    type: format.Type.DATE
                })
            ]);

            invoicesSearch.filterExpression = invoicesFilterExpression;
            let invoicesSearchResults = invoicesSearch.run();

            context.state.data.splice(0);
            let fieldIds = ['statusref', 'trandate', 'invoicenum', 'amountremaining', 'total', 'duedate'];
            invoicesSearchResults.each(function (invoiceResult) {
                let tmp = {};

                for (let fieldId of fieldIds)
                    tmp[fieldId] = invoiceResult.getValue(fieldId);

                tmp['status_text'] = invoiceResult.getText('statusref');
                tmp['invoice_type'] = invoiceResult.getText('custbody_inv_type');
                tmp['invoice_link'] = _getInvoiceURL(invoiceResult.id);
                tmp['id'] = invoiceResult.id;

                tmp['trandate'] = moment(tmp['trandate'], 'D/M/YYYY').format('DD/MM/YYYY').toString();
                tmp['duedate'] = moment(tmp['duedate'], 'D/M/YYYY').format('DD/MM/YYYY').toString();

                context.state.data.push(tmp);

                return true;
            });

            context.state.loading = false;
        }, 150);
    },
};

function _getInvoiceURL(invoice_id) {
    let baseURL = 'https://1048144.app.netsuite.com';
    let compid = '1048144';
    return baseURL + '/app/accounting/transactions/custinvc.nl?id=' + invoice_id +
        '&compid=' + compid + '&cf=116&whence=';
}

export default {
    state,
    getters,
    actions,
    mutations
};