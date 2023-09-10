import http from "@/utils/http";
import moment from 'moment';

const state = {
    invoices: {
        data: [],
        busy: false,
    },
    data: [
        { "id": 4196554,"status_text": "Paid In Full", "invoice_type": "", "invoice_link": "#", "statusref": "paidInFull", "trandate": "31/12/2022", "invoicenum": "Invoice #INV1050668", "amountremaining": ".00", "total": "448.68", "duedate": "15/03/2023" },
        { "id":4220468,"status_text": "Paid In Full", "invoice_type": "", "invoice_link": "#", "statusref": "paidInFull", "trandate": "31/01/2023", "invoicenum": "Invoice #INV1055261", "amountremaining": ".00", "total": "433.62", "duedate": "15/02/2023" },
        { "id":4254837,"status_text": "Paid In Full", "invoice_type": "", "invoice_link": "#", "statusref": "paidInFull", "trandate": "28/02/2023", "invoicenum": "Invoice #INV1063976", "amountremaining": ".00", "total": "403.51", "duedate": "21/01/2024" }
    ],
    status: {
        selected: null,
        options: [
            {value: 'CustInvc:A', text: 'Open Invoices'},
            {value: 'CustInvc:B', text: 'Paid In Full'}
        ]
    },
    period: {
        selected: null,
        options: [
            {
                value: moment().subtract(7, 'days').format('DD/MM/YYYY').toString(),
                text: 'Last 7 Days'
            },
            {
                value: moment().subtract(1, 'months').format('DD/MM/YYYY').toString(),
                text: 'Last Month'
            },
            {
                value: moment().subtract(3, 'months').format('DD/MM/YYYY').toString(),
                text: 'Last 3 Months'
            },
            {
                value: moment().subtract(6, 'months').format('DD/MM/YYYY').toString(),
                text: 'Last 6 Months'
            },
        ]
    },
};

const getters = {
    all : state => state.invoices,
    status : state => state.status,
    period : state => state.period,
};

const mutations = {

};

const actions = {
    init : async context => {
        await _getInvoices(context);
    },
    handleInvoiceFilterChanged : async context => {
        await _getInvoices(context);
    },

};

async function _getInvoices(context) {
    if (!context.rootGetters['customer/id'] || !context.state.status.selected || !context.state.period.selected) return;

    context.state.invoices.busy = true;

    let data = await http.get('getInvoices', {
        customerId: context.rootGetters['customer/id'],
        invoiceStatus: context.state.status.selected,
        invoicePeriod: context.state.period.selected
    });

    context.state.invoices.data = data.map(item => ({
        ...item,
        invoice_link: _getInvoiceURL(item.id),
        trandate: moment(item.trandate, 'D/M/YYYY').format('DD/MM/YYYY').toString(),
        duedate: moment(item.duedate, 'D/M/YYYY').format('DD/MM/YYYY').toString(),
    }));

    context.state.invoices.busy = false;
}

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