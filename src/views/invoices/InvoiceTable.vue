<template>
    <v-row>
        <v-col cols="12">
            <v-data-table :headers="headers" :items="invoices" :loading="busy" no-data-text="No Invoice to Show" :items-per-page="-1"
                          class="elevation-5 background" :hide-default-footer="invoices.length <= 10" loading-text="Loading invoices...">
                <template v-slot:top>
                    <v-toolbar flat dense color="primary" dark>
                        <v-toolbar-title>Invoices</v-toolbar-title>
                        <v-divider class="mx-4" inset vertical></v-divider>
                        <v-toolbar-title class="caption yellow--text">
                            <span></span>
                        </v-toolbar-title>

                        <v-spacer></v-spacer>

                        <v-autocomplete label="Invoice Status" placeholder="Select from the list below"
                                        v-model="invoiceStatus.selected" class="mx-1"
                                        :items="invoiceStatus.options"
                                        dense hide-details solo-inverted
                                        @change="$store.dispatch('invoices/handleInvoiceFilterChanged')"
                                        :disabled="busy" :loading="busy"
                        ></v-autocomplete>

                        <v-autocomplete label="Invoice Period" placeholder="Select from the list below"
                                        v-model="invoicePeriod.selected" class="mx-1"
                                        :items="invoicePeriod.options"
                                        dense hide-details solo-inverted
                                        @change="$store.dispatch('invoices/handleInvoiceFilterChanged')"
                                        :disabled="busy" :loading="busy"
                                        append-outer-icon="mdi-refresh"
                                        @click:append-outer="$store.dispatch('invoices/handleInvoiceFilterChanged')"
                        ></v-autocomplete>
                    </v-toolbar>
                </template>

                <template v-slot:item.trandate="{ item }">
                    {{item.trandate}}
                </template>

                <template v-slot:item.invoicenum="{item}">
                    <a target="_blank" :href="item.invoice_link">{{item.invoicenum.replace(/Invoice #([\w]+)/, '$1')}}</a>
                </template>

                <template v-slot:item.status_text="{item}">
                    {{item.status_text}}
                </template>

                <template v-slot:item.invoice_type="{item}">
                    {{item.invoice_type}}
                </template>

                <template v-slot:item.amountremaining="{item}">
                    {{formatMoney(item.amountremaining)}}
                </template>
                
                <template v-slot:item.total="{item}">
                    {{formatMoney(item.total)}}
                </template>
                
                <template v-slot:item.duedate="{item}">
                    {{item.duedate}}<br>
                </template>
                
                <template v-slot:item.action="{item}">
                    {{item.id}}
                </template>

            </v-data-table>
        </v-col>
    </v-row>
</template>

<script>
export default {
    name: "InvoiceTable",
    data: () => ({
        headers: [
            {value: 'trandate', text: 'Invoice Date', align: 'center', sortable: true},
            {value: 'invoicenum', text: 'Invoice #', align: 'center', sortable: true},
            {value: 'status_text', text: 'Status', align: 'center', sortable: true},
            {value: 'invoice_type', text: 'Type', align: 'center', sortable: true},
            {value: 'amountremaining', text: 'Due Amount', align: 'center', sortable: true},
            {value: 'total', text: 'Total Amount', align: 'center', sortable: true},
            {value: 'duedate', text: 'Due Date', align: 'center', sortable: true},
            {value: 'action', text: '', sortable: false},
        ],
    }),
    methods: {
        formatMoney(amount) {
            return '$' + parseFloat(amount).toLocaleString('en-AU')
        }
    },
    computed: {
        invoices() {
            return this.$store.getters['invoices/all'].data;
        },
        busy() {
            return this.$store.getters['invoices/all'].busy;
        },
        franchiseeMode() {
            return this.$store.getters['user/isFranchisee'];
        },
        invoiceStatus() {
            return this.$store.getters['invoices/status'];
        },
        invoicePeriod() {
            return this.$store.getters['invoices/period'];
        }
    }
};
</script>

<style scoped>

</style>