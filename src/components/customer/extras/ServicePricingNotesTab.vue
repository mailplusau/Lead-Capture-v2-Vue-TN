<template>
    <b-tab title="Services & Pricing Notes" active>
        <b-row>
            <b-col cols="12">
                <b-form-group
                    class="text-start"
                    label="Pricing Notes:"
                    description="We will convert your text to lowercase instantly"
                >
                    <b-form-textarea v-model="pricingNotes.data" rows="3" no-resize :disabled="pricingNotes.disabled" ref="pricingNoteTextarea"></b-form-textarea>
                </b-form-group>
            </b-col>
            <b-col cols="12" class="mb-4">
                <b-button @click="editForm" v-if="pricingNotes.disabled" size="sm" :disabled="busy" variant="outline-primary">Edit Pricing Notes</b-button>
                <template v-else>
                    <b-button @click="resetForm" size="sm" class="mx-2" :disabled="busy">Reset</b-button>
                    <b-button @click="cancelEditing" size="sm" class="mx-2" :disabled="busy" variant="outline-danger">Cancel</b-button>
                    <b-button @click="saveForm" size="sm" class="mx-2" :disabled="busy" variant="outline-success">Save</b-button>
                </template>
            </b-col>

            <b-col xl="6" cols="6">
                <h2>Services</h2>
                <b-table :items="assignedServices" :fields="serviceColumns" head-row-variant="light" striped show-empty :tbody-tr-class="rowClass">

                    <template v-slot:cell(name)="{item}">
                        <b-input-group>
                            <b-form-select v-model="item.custrecord_service" :options="$store.getters['services/serviceTypes']" size="sm" :disabled="item.toBeDeleted || assignedServicesDisabled">
                                <template v-slot:first>
                                    <b-form-select-option :value="null" disabled>-- Select A Service --</b-form-select-option>
                                </template>
                            </b-form-select>
                        </b-input-group>
                    </template>

                    <template v-slot:cell(desc)="{item}">
                        <span v-if="item.toBeDeleted" class="deleted-item">{{item.custrecord_service_description}}</span>
                        <input v-else type="text" :class="'form-control-sm text-center ' + (!assignedServicesDisabled ? 'form-control' : 'form-control-plaintext')"
                               v-model="item.custrecord_service_description" :readonly="assignedServicesDisabled">
                    </template>

                    <template v-slot:cell(price)="{item}">
                        <span v-if="item.toBeDeleted" class="deleted-item">${{item.custrecord_service_price}}</span>
                        <input v-else type="number" step="0.01" :class="'form-control-sm text-center ' + (!assignedServicesDisabled ? 'form-control' : 'form-control-plaintext')"
                               v-model="item.custrecord_service_price" :readonly="assignedServicesDisabled">
                    </template>

                    <template v-slot:cell(action)="{index, item}" v-if="!assignedServicesDisabled">
                        <b-button v-if="item.toBeDeleted" size="sm" variant="link" @click="restoreAssignedService(index)" title="Restore this service">
                            <b-icon :icon="'recycle'" variant="success"></b-icon>
                        </b-button>
                        <b-button v-else size="sm" variant="link" @click="deleteAssignedService(index)" title="Delete this service">
                            <b-icon :icon="'trash'" variant="danger"></b-icon>
                        </b-button>
                    </template>

                    <template v-slot:custom-foot v-if="false"> <!-- Hiding this for now -->
                        <b-tr style="background-color: #9ed79b">
                            <b-td :colspan="serviceColumns.length">
                                <template v-if="!assignedServicesDisabled">
                                    <b-button class="mx-2" size="sm" variant="outline-primary" @click="addNewAssignedService" :disabled="assignedServicesBusy">Add New Service</b-button>
                                    <b-button class="mx-2" size="sm" variant="outline-danger" @click="cancelEditingAssignedServicesForm" :disabled="assignedServicesBusy">Cancel</b-button>
                                    <b-button class="mx-2" size="sm" variant="outline" @click="resetAssignedServicesForm" :disabled="assignedServicesBusy">Reset</b-button>
                                    <b-button class="mx-2" size="sm" variant="outline-success" @click="saveAssignedServicesForm" :disabled="assignedServicesBusy">Save</b-button>
                                </template>
                                <b-button block size="sm" v-else @click="editAssignedServicesForm" :disabled="assignedServicesBusy">
                                    Update Services
                                </b-button>
                            </b-td>
                        </b-tr>
                    </template>
                </b-table>
            </b-col>

            <b-col xl="6" cols="6">
                <h2>Item Pricing</h2>

                <b-table :items="itemPricing" :fields="itemPricingColumns" striped head-row-variant="light" show-empty :tbody-tr-class="rowClass">
                    <template v-slot:cell(name)="{item}">
                        <input class="form-control highlight-disabled" disabled :value="item.text">
                    </template>
                    <template v-slot:cell(price)="{item}">
                        <input class="form-control highlight-disabled" disabled :value="'$'+item.price">
                    </template>
                </b-table>

            </b-col>

            <b-col cols="12">
                <b-button variant="primary" @click="goToServiceAndPricingPage" :disabled="busy" size="sm">
                    Update Service & Financial Tab <b-icon icon="box-arrow-up-right" scale=".6"></b-icon>
                </b-button>
            </b-col>
        </b-row>
    </b-tab>
</template>

<script>
export default {
    name: "ServicePricingNotesTab",
    data: () => ({
        serviceColumns: [
            {key: 'name', label: 'Name'},
            {key: 'desc', label: 'Description'},
            {key: 'price', label: 'Price'},
            {key: 'action', label: ''},
        ],
        itemPricingColumns: [
            {key: 'name', label: 'Item Name'},
            {key: 'price', label: 'Item Price'},
        ],
        editMode: false,
        pricingNotes: {
            disabled: true,
            data: '',
        }
    }),
    methods: {
        goToServiceAndPricingPage() {
            let baseURL = 'https://1048144.app.netsuite.com';

            let params = {
                custid: this.$store.getters['customer/internalId'],
                servicechange: 1
            }
            params = JSON.stringify(params);

            let upload_url = baseURL + window.nlapiResolveURL('SUITELET', 'customscript_sl_smc_main', 'customdeploy_sl_smc_main') + '&unlayered=T&custparam_params=' + params;
            window.open(upload_url, "_self", "height=750,width=650,modal=yes,alwaysRaised=yes");  
        },
        rowClass(item, type) {
            if (!item || type !== 'row') return
            if (item.toBeDeleted) return 'table-danger'
        },

        editForm() {
            this.pricingNotes.disabled = false;
        },
        resetForm() {
            this.pricingNotes.data = this.additionalInfo.custentity_customer_pricing_notes;
        },
        cancelEditing() {
            this.pricingNotes.data = this.additionalInfo.custentity_customer_pricing_notes;
            this.pricingNotes.disabled = true;
        },
        saveForm() {
            this.pricingNotes.disabled = true;
            this.additionalInfo.custentity_customer_pricing_notes = this.pricingNotes.data;
            this.$store.dispatch('customer/saveAdditionalInfo');
        },

        addNewAssignedService() {
            this.$store.commit('services/addNewAssignedService');
        },
        deleteAssignedService(index) {
            this.$store.commit('services/deleteAnAssignedService', index);
        },
        restoreAssignedService(index) {
            this.$store.commit('services/restoreAnAssignedService', index);
        },
        editAssignedServicesForm() {
            this.$store.commit('services/disableAssignedServicesForm', false);
        },
        resetAssignedServicesForm() {
            this.$store.commit('services/resetAssignedServicesForm');
        },
        cancelEditingAssignedServicesForm() {
            this.$store.commit('services/disableAssignedServicesForm');
            this.$store.commit('services/resetAssignedServicesForm');
        },
        saveAssignedServicesForm() {
            this.$store.dispatch('services/saveAssignedServices');
        }
    },
    computed: {
        additionalInfo() {
            return this.$store.getters['customer/additionalInfoForm'];
        },
        busy() {
            return this.$store.getters['customer/busy'];
        },
        assignedServicesDisabled() {
            return this.$store.getters['services/assignedServicesDisabled'];
        },
        assignedServicesBusy() {
            return this.$store.getters['services/assignedServicesBusy'];
        },
        assignedServices() {
            return this.$store.getters['services/assignedServices']
        },
        itemPricing() {
            return this.$store.getters['item-pricing/get']
        }
    },
    watch: {
        'additionalInfo.custentity_customer_pricing_notes': function (val) {
            this.pricingNotes.data = val;
        }
    }
}
</script>

<style scoped>
.deleted-item {
    text-decoration: line-through;
    color: gray;
    font-size: 11pt;
}
.highlight-disabled {
    color: black !important;
    border: 1px solid #cccccc !important;
    font-size: inherit;
}
</style>