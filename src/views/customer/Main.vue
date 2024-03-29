<template>
    <v-container>
        <v-form ref="form" v-model="valid" lazy-validation :disabled="formDisabled || formBusy">
            <v-row justify="center">
                <v-col cols="12" class="text-center">
                    <p class="text-h5 font-weight-bold primary--text">Basic Information</p>
                </v-col>

                <v-col cols="4" v-show="customerId">
                    <v-text-field dense label="Internal ID" :value="form.entityid" disabled></v-text-field>
                </v-col>

                <v-col v-if="dataAdminMode" cols="8">
                    <v-text-field dense v-if="franchiseeMode" label="Account Manager"
                                  :value="$store.getters['user/salesRep'].name" disabled></v-text-field>
                    <v-autocomplete dense v-else label="Account Manager" :disabled="franchiseeMode || formDisabled || formBusy"
                        v-model="form.custentity_mp_toll_salesrep"
                        :items="$store.getters['misc/accountManagers']"
                        :rules="[v => validate(v, !franchiseeMode ? 'required' : '')]"
                    ></v-autocomplete>
                </v-col>

                <v-col :cols="franchiseeMode ? 12 : 6">
                    <v-text-field dense label="Company Name" v-model="form.companyname"
                                  :rules="[v => validate(v, 'required|minLength:5')]"
                    ></v-text-field>
                </v-col>

                <v-col cols="6" v-if="!franchiseeMode">
                    <v-text-field dense label="ABN"
                                  :value="form.vatregnumber"
                                  @input="v => {form.vatregnumber = keepOnlyNumericalCharacters(v)}"
                                  @keydown="allowOnlyNumericalInput"
                                  :rules="[v => validate(v, 'abn')]"
                    ></v-text-field>
                </v-col>

                <v-col cols="6" v-if="!franchiseeMode">
                    <v-text-field dense label="Account (main) email" v-model="form.email"
                                  :rules="[v => validate(v, 'email')]"
                    ></v-text-field>
                </v-col>

                <v-col cols="6" v-if="!franchiseeMode">
                    <v-text-field dense label="Account (main) phone"
                                  :value="form.altphone"
                                  @input="v => {form.altphone = keepOnlyNumericalCharacters(v)}"
                                  @keydown="allowOnlyNumericalInput"
                                  :rules="[v => validate(v, 'ausPhone')]"
                    ></v-text-field>
                </v-col>

                <v-col cols="6">
                    <v-text-field dense label="Day-to-day email" v-model="form.custentity_email_service"
                                  :rules="[v => validate(v, 'email')]"
                    ></v-text-field>
                </v-col>

                <v-col cols="6">
                    <v-text-field dense label="Day-to-day phone"
                                  :value="form.phone"
                                  @input="v => {form.phone = keepOnlyNumericalCharacters(v)}"
                                  @keydown="allowOnlyNumericalInput"
                                  :rules="[v => validate(v, 'ausPhone')]"
                    ></v-text-field>
                </v-col>

                <v-col cols="6">
                    <v-text-field dense label="Website" v-model="form.custentity_website_page_url"
                                  placeholder="https://"
                    ></v-text-field>
                </v-col>

                <v-col cols="6">
                    <v-autocomplete dense multiple label="Previous Carrier" :disabled="formDisabled || formBusy"
                                    v-model="form.custentity_previous_carrier"
                                    :items="$store.getters['misc/carrierList']"
                    ></v-autocomplete>
                </v-col>

                <v-col cols="6" v-if="dataAdminMode">
                    <v-autocomplete dense label="Franchisee" :disabled="franchiseeMode || formDisabled || formBusy"
                                    v-model="form.partner"
                                    :items="$store.getters['misc/franchisees']"
                                    :rules="[v => validate(v, 'required')]"
                    ></v-autocomplete>
                </v-col>

                <v-col cols="6" v-if="!franchiseeMode">
                    <v-autocomplete dense label="Lead Source" :disabled="franchiseeMode || formDisabled || formBusy"
                                    v-model="form.leadsource"
                                    :items="$store.getters['misc/leadSources']"
                                    :rules="[v => validate(v, 'required')]"
                                    @change="handleLeadSourceChanged"
                    ></v-autocomplete>
                </v-col>

                <v-col cols="6" v-if="showOldCustomerFields">
                    <v-autocomplete dense label="Old Franchisee" :readonly="true" :disabled="false"
                                    v-model="form.custentity_old_zee"
                                    :items="$store.getters['misc/franchisees']"
                                    persistent-placeholder placeholder="Please enter the correct ID for the old customer"
                                    :rules="[v => validate(v, 'required')]"
                    ></v-autocomplete>
                </v-col>

                <v-col cols="6" v-if="showOldCustomerFields">
                    <v-text-field dense label="Old Customer ID" v-model="form.custentity_old_customer"
                                  @keypress="allowOnlyNumericalInput"
                                  :disabled="checkingOldCustomerId" :loading="checkingOldCustomerId"
                                  :rules="[v => validate(v, 'required'), () => handleOldCustomerIdChanged()]"
                    ></v-text-field>
                </v-col>

                <v-col cols="6" v-if="!franchiseeMode">
                    <v-autocomplete dense label="Industry"
                                    v-model="form.custentity_industry_category"
                                    :items="$store.getters['misc/industries']"
                                    :rules="[v => validate(v, 'required')]"
                    ></v-autocomplete>
                </v-col>

                <v-col :cols="dataAdminMode || franchiseeMode ? 6 : 12" v-if="!franchiseeMode">
                    <v-autocomplete dense label="Status"
                                    v-model="form.entitystatus"
                                    :items="$store.getters['misc/statuses']"
                                    :rules="[v => validate(v, 'required')]"
                    ></v-autocomplete>
                </v-col>

                <v-col cols="12" class="text-center" v-if="customerId">
                    <v-btn v-if="formDisabled" @click="editForm">Edit Customer's Details</v-btn>
                    <template v-else>
                        <v-btn class="mx-2" @click="cancelEditing">Cancel</v-btn>
                        <v-btn class="mx-2" @click="resetForm">Reset</v-btn>
                        <v-btn class="mx-2" @click="saveForm" :disabled="!valid">Save</v-btn>
                    </template>
                </v-col>
            </v-row>
        </v-form>
    </v-container>
</template>

<script>
import {allowOnlyNumericalInput, keepOnlyNumericalCharacters, debounce, rules} from '@/utils/utils.mjs';

export default {
    name: "Main",
    data: () => ({
        valid: true,
        checkingOldCustomerId: false,
        showOldCustomerFields: false,
    }),
    created() {
        this.debouncedHandleOldCustomerIdChanged = debounce(async () => {
            if (!this.form.custentity_old_customer) return;

            this.checkingOldCustomerId = true;
            await this.$store.dispatch('customer/handleOldCustomerIdChanged');
            this.checkingOldCustomerId = false;
            return !!this.form.custentity_old_zee || 'Invalid Id for old customer'
        }, 2000);

        this.debouncedHandleFormChanged = debounce(async () => {
            console.log('form change detected');
            await this.$store.dispatch('customer/saveStateToLocalStorage');
        }, 2000);

        if (!this.$store.getters['customer/id'])
            this.$store.watch(() => this.$store.getters['customer/form'].data, this.debouncedHandleFormChanged, {deep: true});
    },
    mounted() {
        this.$refs.form.resetValidation();
    },
    methods: {
        validate: rules.validate,
        allowOnlyNumericalInput,
        keepOnlyNumericalCharacters,
        resetValidation () {
            this.$refs.form.resetValidation()
        },
        handleLeadSourceChanged(newValue) {
            // show these fields when lead source is Change of Entity or Relocation
            if (parseInt(newValue) === 202599 || parseInt(newValue) === 217602)
                this.showOldCustomerFields = true;
            else { // otherwise hide the fields and reset them
                this.showOldCustomerFields = false;
                this.form.custentity_old_customer = '';
                this.form.custentity_old_zee = '';
            }
            this.$refs.form.validate();
        },
        editForm() {
            this.$store.commit('customer/disableForm', false);
        },
        resetForm() {
            this.$store.commit('customer/resetForm');
            this.$refs.form.resetValidation();
        },
        cancelEditing() {
            this.$store.commit('customer/resetForm');
            this.$store.commit('customer/disableForm');
            this.$refs.form.resetValidation();
        },
        saveForm() {
            let res = this.$refs.form.validate();
            console.log('Form validation result', res);
            if (!res) return;
            console.log('Form validated, let\'s go');
            this.$store.dispatch('customer/save');
        },
        handleOldCustomerIdChanged() {
            this.debouncedHandleOldCustomerIdChanged();
        },
        triggerValidation() {
            let res = this.$refs.form.validate();
            if (!res) this.$vuetify.goTo(0);

            return res;
        }
    },
    computed: {
        customerId() {
            return this.$store.getters['customer/id'];
        },
        franchiseeMode() {
            return this.$store.getters['user/isFranchisee'];
        },
        dataAdminMode() {
            return this.$store.getters['user/isDataAdmin']
        },
        form() {
            return this.$store.getters['customer/form'].data;
        },
        formBusy() {
            return this.$store.getters['customer/form'].busy;
        },
        formDisabled() {
            return this.$store.getters['customer/form'].disabled;
        },
    },
};
</script>

<style scoped>

</style>