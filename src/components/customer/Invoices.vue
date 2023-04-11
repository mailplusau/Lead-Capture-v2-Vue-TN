<template>
    <b-card v-if="$store.getters['customer/showInvoicesSection']" border-variant="primary" bg-variant="transparent" class="my-3">
        <div class="row justify-content-between align-items-stretch">
            <div class="col-12">
                <h1 class="text-center mp-header">{{ sectionTitle }}</h1>
            </div>
            <div class="col-4 mb-4">
                <b-input-group prepend="Invoice Type">
                    <b-form-select v-model="invoiceStatus" :disabled="loading"
                                   :options="$store.getters['invoices/statuses']"></b-form-select>
                </b-input-group>
            </div>
            <div class="col-4 mb-4">
                <b-input-group prepend="Invoice Period">
                    <b-form-select v-model="invoicePeriod" :disabled="loading"
                                   :options="$store.getters['invoices/periods']"></b-form-select>
                </b-input-group>
            </div>
            <div class="col-4 mb-4">
                <b-input-group prepend="Search">
                    <b-form-input v-model="filter"></b-form-input>
                </b-input-group>
            </div>
            <div class="col-auto mb-4">
                <b-input-group prepend="Items to show per page">
                    <b-form-select v-model="pagination.perPage" :options="perPageOptions"></b-form-select>
                </b-input-group>
            </div>
            <div class="col-auto mb-4">
                <b-pagination
                    v-model="pagination.currentPage"
                    :total-rows="invoices.length"
                    :per-page="pagination.perPage"
                    aria-controls="my-table"
                ></b-pagination>
            </div>
            <div class="col-12">
                <b-table :items="invoices" :fields="fields" striped responsive="sm" head-row-variant="light" hover :busy="loading"
                         label-sort-asc="" label-sort-desc="" label-sort-clear="" :filter="filter" show-empty
                         :per-page="pagination.perPage" :current-page="pagination.currentPage">

                    <template v-slot:empty>
                        No Invoice To Show
                    </template>

                    <template v-slot:table-busy>
                        <div class="text-center text-danger my-2">
                            <b-spinner class="align-middle mx-2"></b-spinner>
                            <strong>Retrieving Invoices...</strong>
                        </div>
                    </template>

                    <template v-slot:cell(trandate)="{item}">
                        {{item.trandate}}
                    </template>
                    <template v-slot:cell(invoicenum)="{item}">
                        <a target="_blank" :href="item.invoice_link">{{item.invoicenum.replace(/Invoice #([\w]+)/, '$1')}}</a>
                    </template>
                    <template v-slot:cell(status_text)="{item}">
                        {{item.status_text}}
                    </template>
                    <template v-slot:cell(invoice_type)="{item}">
                        {{item.invoice_type}}
                    </template>
                    <template v-slot:cell(amountremaining)="{item}">
                        {{formatMoney(item.amountremaining)}}
                    </template>
                    <template v-slot:cell(total)="{item}">
                        {{formatMoney(item.total)}}
                    </template>
                    <template v-slot:cell(duedate)="{item}">
                        {{formatDate(item.duedate)}}<br>
                        <span class="text-small">({{formatDate(item.duedate, true)}})</span>
                    </template>
                    <template v-slot:cell(action)="{item}">
                        {{item.id}}
                    </template>
                </b-table>
            </div>
        </div>
    </b-card>
</template>

<script>
import moment from 'moment-timezone';
import 'moment/locale/en-au';

export default {
    name: "Invoices",
    data: () => ({
        filter: '',
        fields: [
            {key: 'trandate', label: 'Invoice Date', sortable: true},
            {key: 'invoicenum', label: 'Invoice #', sortable: true},
            {key: 'status_text', label: 'Status', sortable: true},
            {key: 'invoice_type', label: 'Type', sortable: true},
            {key: 'amountremaining', label: 'Due Amount', sortable: true},
            {key: 'total', label: 'Total Amount', sortable: true},
            {key: 'duedate', label: 'Due Date', sortable: true},
            {key: 'action', label: '', sortable: false},
        ],
        pagination: {
            perPage: 10,
            currentPage: 1,
        },
        perPageOptions: [
            1, 2, 5, 10, 15, 25, 50
        ],
    }),
    methods: {
        formatDate(date, fromNow = false) {
            let formattedDate = moment(date, 'DD/MM/YYYY');
            return fromNow ? formattedDate.fromNow() : formattedDate.format('DD/MM/YYYY');
        },
        formatMoney(amount) {
            return '$' + parseFloat(amount).toLocaleString('en-AU')
        }
    },
    computed: {
        sectionTitle() {
            return 'Customer\'s Invoices'
        },
        invoices() {
            return this.$store.getters['invoices/all'];
        },
        loading() {
            return this.$store.getters['invoices/loading'];
        },
        invoiceStatus: {
            get() {
                return this.$store.getters['invoices/status'];
            },
            set(val) {
                this.$store.commit('invoices/setStatus', val);
                if (val) this.$store.dispatch('invoices/getInvoices');
            }
        },
        invoicePeriod: {
            get() {
                return this.$store.getters['invoices/period'];
            },
            set(val) {
                this.$store.commit('invoices/setPeriod', val);
                if (val) this.$store.dispatch('invoices/getInvoices');
            }
        },
    }
}
</script>

<style scoped>
.text-small {
    font-size: 0.8em;
}
</style>