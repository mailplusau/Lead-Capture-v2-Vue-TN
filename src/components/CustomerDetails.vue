<template>
    <b-card border-variant="primary" bg-variant="transparent">
        <div class="row justify-content-center" >
            <div class="col-12">
                <h1 class="text-center mp-header">Customer's Details</h1>
            </div>

            <div class="col-6 mb-4" v-show="hasInternalId">
                <b-input-group prepend="Internal ID">
                    <b-form-input :value="$store.getters['customer/internalId']" disabled></b-form-input>
                </b-input-group>
            </div>
            <div class="col-6 mb-4">
                <!-- if the user is a franchisee, this is disabled and show the assigned sales rep-->
                <b-input-group prepend="Account Manager">
                    <b-form-select v-model="detailForm.custentity_mp_toll_salesrep" v-validate="hasInternalId ? 'required' : ''" data-vv-name="account_manager"
                                   :options="$store.getters['customer/accountManagers']" :disabled="formDisabled || isFranchiseeRole"></b-form-select>

                    <b-form-invalid-feedback :state="!errors.has('account_manager')">{{ errors.first('account_manager') }}</b-form-invalid-feedback>
                </b-input-group>
            </div>

            <div class="col-8 mb-4">
                <b-input-group prepend="Company Name">
                    <b-form-input v-model="detailForm.companyname" v-validate="'required|min:5'" data-vv-name="company_name"
                                  :class="errors.has('company_name') ? 'is-invalid' : ''" :disabled="formDisabled"></b-form-input>

                    <b-form-invalid-feedback :state="!errors.has('company_name')">{{ errors.first('company_name') }}</b-form-invalid-feedback>
                </b-input-group>
            </div>
            <div class="col-4 mb-4" v-show="!isFranchiseeRole">
                <b-input-group prepend="ABN">
                    <b-form-input v-model="detailForm.vatregnumber" v-validate="detailForm.vatregnumber && !isFranchiseeRole ? 'aus_abn|min:9' : ''" data-vv-name="abn"
                                  :class="errors.has('abn') ? 'is-invalid' : ''" :disabled="formDisabled"></b-form-input>

                    <b-form-invalid-feedback :state="!errors.has('abn')">{{ errors.first('abn') }}</b-form-invalid-feedback>
                </b-input-group>
            </div>
            <div class="col-7 mb-4" v-show="!isFranchiseeRole">
                <b-input-group prepend="Account (main) email">
                    <b-form-input v-model="detailForm.email" v-validate="!isFranchiseeRole ? 'email' : ''" data-vv-name="email" @keydown.space.prevent
                                  :class="errors.has('email') ? 'is-invalid' : ''" :disabled="formDisabled"></b-form-input>

                    <b-form-invalid-feedback :state="!errors.has('email')">{{ errors.first('email') }}</b-form-invalid-feedback>
                </b-input-group>
            </div>
            <div class="col-5 mb-4" v-show="!isFranchiseeRole">
                <b-input-group prepend="Account (main) phone">
                    <b-form-input v-model="detailForm.altphone" v-validate="!isFranchiseeRole ? 'digits:10|aus_phone' : ''"
                                  data-vv-name="phone" @keydown.space.prevent
                                  :class="errors.has('phone') ? 'is-invalid' : ''" :disabled="formDisabled"></b-form-input>

                    <b-form-invalid-feedback :state="!errors.has('phone')">{{ errors.first('phone') }}</b-form-invalid-feedback>
                </b-input-group>
            </div>
            <div class="col-7 mb-4">
                <b-input-group prepend="Day-to-day email">
                    <b-form-input v-model="detailForm.custentity_email_service" v-validate="isFranchiseeRole ? 'email' : 'required|email'" data-vv-name="alt_email" @keydown.space.prevent
                                  :class="errors.has('alt_email') ? 'is-invalid' : ''" :disabled="formDisabled"></b-form-input>

                    <b-form-invalid-feedback :state="!errors.has('alt_email')">{{ errors.first('alt_email') }}</b-form-invalid-feedback>
                </b-input-group>
            </div>
            <div class="col-5 mb-4">
                <b-input-group prepend="Day-to-day phone">
                    <b-form-input v-model="detailForm.phone" v-validate="'required|digits:10|aus_phone'" data-vv-name="alt_phone" @keydown.space.prevent
                                  :class="errors.has('alt_phone') ? 'is-invalid' : ''" :disabled="formDisabled"></b-form-input>

                    <b-form-invalid-feedback :state="!errors.has('alt_phone')">{{ errors.first('alt_phone') }}</b-form-invalid-feedback>
                </b-input-group>
            </div>
            <div class="col-6 mb-4">
                <b-input-group prepend="Franchisee">
                    <b-form-select v-model="detailForm.partner" v-validate="'required'" data-vv-name="franchisee"
                                   :options="$store.getters['franchisees']" :disabled="formDisabled || isFranchiseeRole"></b-form-select>

                    <b-form-invalid-feedback :state="!errors.has('franchisee')">{{ errors.first('franchisee') }}</b-form-invalid-feedback>
                </b-input-group>
            </div>
            <div class="col-6 mb-4">
                <b-input-group prepend="Lead source">
                    <b-form-select v-model="detailForm.leadsource" v-validate="'required'" data-vv-name="lead_source"
                                   :options="$store.getters['leadSources']" :disabled="formDisabled || isFranchiseeRole"></b-form-select>

                    <b-form-invalid-feedback :state="!errors.has('lead_source')">{{ errors.first('lead_source') }}</b-form-invalid-feedback>
                </b-input-group>
            </div>

            <div class="col-6 mb-4" v-show="showOldCustomerFields">
                <b-input-group prepend="Old Franchisee">
                    <b-form-select v-model="detailForm.custentity_old_zee"
                                   :options="$store.getters['franchisees']" disabled></b-form-select>

                    <b-form-invalid-feedback :state="!oldCustomerIdInvalid">
                        Please input the valid and correct ID for Old Customer ID field.
                    </b-form-invalid-feedback>
                </b-input-group>
            </div>
            <div class="col-6 mb-4" v-show="showOldCustomerFields">
                <b-input-group prepend="Old Customer ID">
                    <b-form-input v-model="detailForm.custentity_old_customer" v-validate="showOldCustomerFields ? 'required|numeric' : ''" data-vv-name="old_customer_id"
                                  :class="errors.has('old_customer_id') ? 'is-invalid' : ''" :disabled="formDisabled || oldCustomerIdFieldDisabled"></b-form-input>

                    <b-form-invalid-feedback :state="!errors.has('old_customer_id') || !oldCustomerIdInvalid">
                        {{ errors.first('old_customer_id') }}
                        {{oldCustomerIdInvalid ? 'Old Customer ID is invalid.' : ''}}
                    </b-form-invalid-feedback>
                </b-input-group>
            </div>

            <div class="col-6 mb-4" v-show="!isFranchiseeRole">
                <b-input-group prepend="Industry">
                    <b-form-select v-model="detailForm.custentity_industry_category" v-validate="!isFranchiseeRole ? 'required' : ''" data-vv-name="industry"
                                   :options="$store.getters['industries']" :disabled="formDisabled"></b-form-select>

                    <b-form-invalid-feedback :state="!errors.has('industry')">{{ errors.first('industry') }}</b-form-invalid-feedback>
                </b-input-group>
            </div>

            <div class="col-6 mb-4" v-show="!isFranchiseeRole">
                <b-input-group prepend="Status">
                    <b-form-select v-model="detailForm.entitystatus" v-validate="!isFranchiseeRole ? 'required' : ''" data-vv-name="status"
                                   :options="$store.getters['statuses']" :disabled="formDisabled"></b-form-select>

                    <b-form-invalid-feedback :state="!errors.has('status')">{{ errors.first('status') }}</b-form-invalid-feedback>
                </b-input-group>
            </div>

            <div class="col-6 mb-4">
                <CheckboxInputGroup v-model="brochureHandedOver" label="Brochure handed over" :disabled="formDisabled || busy"/>
            </div>

            <div class="col-6 mb-4">
                <CheckboxInputGroup v-model="expectingCall" label="Expecting a call to discuss service" :disabled="formDisabled || busy"/>
            </div>

            <template v-if="isFranchiseeRole">
                <div class="col-12 mb-4">
                    <b-form-group class="text-start" label="" description="">
                        <b-form-textarea v-model="detailForm.custentity_operation_notes"
                                         v-validate="isFranchiseeRole && !brochureHandedOver && !expectingCall ? 'required' : ''"
                                         data-vv-name="reason_for_lead"
                                         :class="errors.has('reason_for_lead') ? 'is-invalid' : ''"
                                         rows="3" no-resize :disabled="formDisabled" placeholder="Please provide a reason on why this is lead."></b-form-textarea>

                        <b-form-invalid-feedback :state="!errors.has('reason_for_lead')">{{ errors.first('reason_for_lead') }}</b-form-invalid-feedback>
                    </b-form-group>
                </div>
            </template>

            <div class="col-12" v-if="hasInternalId">
                <b-button @click="editForm" v-if="formDisabled" size="sm" :disabled="busy" variant="outline-primary">Edit Customer's Details</b-button>
                <template v-else>
                    <b-button @click="resetForm" size="sm" class="mx-2" :disabled="busy">Reset</b-button>
                    <b-button @click="cancelEditing" size="sm" class="mx-2" :disabled="busy" variant="outline-danger">Cancel</b-button>
                    <b-button @click="saveForm" size="sm" class="mx-2" :disabled="busy" variant="outline-success">Save</b-button>
                </template>
            </div>
        </div>
    </b-card>
</template>

<script>
import {debounce} from "../utils/utils";
import CheckboxInputGroup from "./misc/CheckboxInputGroup";

export default {
    name: "CustomerDetails",
    components: {CheckboxInputGroup},
    data: () => ({
        oldCustomerIdFieldDisabled: false,
        showOldCustomerFields: false,
        oldCustomerIdInvalid: false,
    }),
    created() {
        this.debouncedHandleOldCustomerIdChanged = debounce(async (newValue, oldValue) => {
            console.log("value changed: ", newValue, oldValue);
            if (!await this.$validator.validateAll(['old_customer_id'])) return;

            this.oldCustomerIdFieldDisabled = true;
            await this.$store.dispatch('customer/handleOldCustomerIdChanged');
            if (!this.detailForm.custentity_old_zee) this.oldCustomerIdInvalid = true;
            this.oldCustomerIdFieldDisabled = false;
        }, 2000);
    },
    methods: {
        async checkForm() {
            return await this.$validator.validateAll() && (this.showOldCustomerFields ? !this.oldCustomerIdInvalid : true);
        },
        editForm() {
            this.$store.commit('customer/disableDetailForm', false);
        },
        resetForm() {
            this.$store.commit('customer/resetDetailForm');
            this.$validator.reset();
        },
        cancelEditing() {
            this.$store.commit('customer/resetDetailForm');
            this.$store.commit('customer/disableDetailForm');
            this.$validator.reset();
        },
        saveForm() {
            this.$validator.validateAll().then((result) => {
                if (result && (this.showOldCustomerFields ? !this.oldCustomerIdInvalid : true)) {
                    console.log('Form Submitted!');
                    this.$store.dispatch('customer/saveCustomer');
                } else console.log('Correct them errors!');
            });
        },
        handleCheckboxChange() {
            if (this.isFranchiseeRole) {
                if (this.brochureHandedOver || this.expectingCall)
                    this.detailForm.entitystatus = 57; // SUSPECT-Hot Lead
                else
                    this.detailForm.entitystatus = 6; // SUSPECT-New
            }
        }
    },
    computed: {
        detailForm() {
            return this.$store.getters['customer/detailForm'];
        },
        formDisabled() {
            return (this.$store.getters['customer/detailFormDisabled'] || this.$store.getters['customer/busy']);
        },
        hasInternalId() {
            return !!this.$store.getters['customer/internalId'];
        },
        busy() {
            return this.$store.getters['customer/busy'];
        },
        isFranchiseeRole() {
            return this.$store.getters['userRole'] === 1000;
        },
        brochureHandedOver: {
            get() {
                return parseInt(this.$store.getters['customer/detailForm'].custentity_brochure_handed_over) === 1;
            },
            set(val) {
                this.$store.getters['customer/detailForm'].custentity_brochure_handed_over = val ? 1 : 2;
                this.handleCheckboxChange();
            }
        },
        expectingCall: {
            get() {
                return parseInt(this.$store.getters['customer/detailForm'].custentity_expecting_call) === 1;
            },
            set(val) {
                this.$store.getters['customer/detailForm'].custentity_expecting_call = val ? 1 : 2;
                this.handleCheckboxChange();
            }
        },
    },
    watch: {
        'detailForm.custentity_old_customer': function (...args) {
            this.oldCustomerIdInvalid = false;
            this.debouncedHandleOldCustomerIdChanged(...args);
        },
        'detailForm.leadsource': function (newValue) {
            // show these fields when lead source is Change of Entity or Relocation
            if (parseInt(newValue) === 202599 || parseInt(newValue) === 217602)
                this.showOldCustomerFields = true;
            else { // otherwise hide the fields and reset them
                this.showOldCustomerFields = false;
                this.detailForm.custentity_old_customer = '';
                this.detailForm.custentity_old_zee = '';
            }
        },
    }
}
</script>

<style scoped>

</style>