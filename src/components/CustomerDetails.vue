<template>

    <div class="row justify-content-center" >
        <div class="col-12">
            <h1 class="text-center mp-header">Lead's Details</h1>
        </div>
        <div class="col-8 mb-4">
            <b-input-group prepend="Company Name">
                <b-form-input v-model="detailForm.companyname" v-validate="'required|min:5'" data-vv-name="company_name"
                              :class="errors.has('company_name') ? 'is-invalid' : ''" :disabled="formDisabled"></b-form-input>

                <b-form-invalid-feedback :state="!errors.has('company_name')">{{ errors.first('company_name') }}</b-form-invalid-feedback>
            </b-input-group>
        </div>
        <div class="col-4 mb-4">
            <b-input-group prepend="ABN">
                <b-form-input v-model="detailForm.vatregnumber" v-validate="'required|aus_abn|min:9'" data-vv-name="abn"
                              :class="errors.has('abn') ? 'is-invalid' : ''" :disabled="formDisabled"></b-form-input>

                <b-form-invalid-feedback :state="!errors.has('abn')">{{ errors.first('abn') }}</b-form-invalid-feedback>
            </b-input-group>
        </div>
        <div class="col-7 mb-4">
            <b-input-group prepend="Account (main) email">
                <b-form-input v-model="detailForm.email" v-validate="'required|email'" data-vv-name="email"
                              :class="errors.has('email') ? 'is-invalid' : ''" :disabled="formDisabled"></b-form-input>

                <b-form-invalid-feedback :state="!errors.has('email')">{{ errors.first('email') }}</b-form-invalid-feedback>
            </b-input-group>
        </div>
        <div class="col-5 mb-4">
            <b-input-group prepend="Account (main) phone">
                <b-form-input v-model="detailForm.altphone" v-validate="'required|digits:10|aus_phone'" data-vv-name="phone"
                              :class="errors.has('phone') ? 'is-invalid' : ''" :disabled="formDisabled"></b-form-input>

                <b-form-invalid-feedback :state="!errors.has('phone')">{{ errors.first('phone') }}</b-form-invalid-feedback>
            </b-input-group>
        </div>
        <div class="col-7 mb-4">
            <b-input-group prepend="Day-to-day email">
                <b-form-input v-model="detailForm.custentity_email_service" v-validate="'required|email'" data-vv-name="alt_email"
                              :class="errors.has('alt_email') ? 'is-invalid' : ''" :disabled="formDisabled"></b-form-input>

                <b-form-invalid-feedback :state="!errors.has('alt_email')">{{ errors.first('alt_email') }}</b-form-invalid-feedback>
            </b-input-group>
        </div>
        <div class="col-5 mb-4">
            <b-input-group prepend="Day-to-day phone">
                <b-form-input v-model="detailForm.phone" v-validate="'required|digits:10|aus_phone'" data-vv-name="alt_phone"
                              :class="errors.has('alt_phone') ? 'is-invalid' : ''" :disabled="formDisabled"></b-form-input>

                <b-form-invalid-feedback :state="!errors.has('alt_phone')">{{ errors.first('alt_phone') }}</b-form-invalid-feedback>
            </b-input-group>
        </div>
        <div class="col-6 mb-4">
            <b-input-group prepend="Industry">
                <b-form-select v-model="detailForm.custentity_industry_category" v-validate="'required'" data-vv-name="industry"
                               :options="$store.getters['industries']" :disabled="formDisabled"></b-form-select>

                <b-form-invalid-feedback :state="!errors.has('industry')">{{ errors.first('industry') }}</b-form-invalid-feedback>
            </b-input-group>
        </div>
        <div class="col-6 mb-4">
            <b-input-group prepend="Lead source">
                <b-form-select v-model="detailForm.leadsource" v-validate="'required'" data-vv-name="lead_source"
                               :options="$store.getters['leadSources']" :disabled="formDisabled"></b-form-select>

                <b-form-invalid-feedback :state="!errors.has('lead_source')">{{ errors.first('lead_source') }}</b-form-invalid-feedback>
            </b-input-group>
        </div>
        <div class="col-6 mb-4">
            <b-input-group prepend="Franchisee">
                <b-form-select v-model="detailForm.partner" v-validate="'required'" data-vv-name="franchisee"
                               :options="$store.getters['franchisees']" :disabled="formDisabled"></b-form-select>

                <b-form-invalid-feedback :state="!errors.has('franchisee')">{{ errors.first('franchisee') }}</b-form-invalid-feedback>
            </b-input-group>
        </div>
        <div class="col-6 mb-4">
            <b-input-group prepend="Status">
                <b-form-select v-model="detailForm.entitystatus" v-validate="'required'" data-vv-name="status"
                               :options="$store.getters['statuses']" :disabled="formDisabled"></b-form-select>

                <b-form-invalid-feedback :state="!errors.has('status')">{{ errors.first('status') }}</b-form-invalid-feedback>
            </b-input-group>
        </div>
        <div class="col-12 mb-4" v-if="hasInternalId">
            <b-button @click="editForm" v-if="formDisabled" :disabled="busy" variant="outline-primary">Edit Customer's Details</b-button>
            <template v-else>
                <b-button @click="resetForm" class="mx-2" :disabled="busy">Reset</b-button>
                <b-button @click="cancelEditing" class="mx-2" :disabled="busy" variant="outline-danger">Cancel</b-button>
                <b-button @click="saveForm" class="mx-2" :disabled="busy" variant="outline-success">Save</b-button>
            </template>
        </div>
    </div>
</template>

<script>
export default {
    name: "CustomerDetails",
    data: () => ({

    }),
    mounted() {

    },
    methods: {
        async checkForm() {
            return await this.$validator.validateAll();
        },
        editForm() {
            this.$store.commit('customer/disableDetailForm', false);
        },
        resetForm() {
            this.$store.commit('customer/resetDetailForm');
        },
        cancelEditing() {
            this.$store.commit('customer/resetDetailForm');
            this.$store.commit('customer/disableDetailForm');
        },
        saveForm() {
            this.$validator.validateAll().then((result) => {
                if (result) {
                    // eslint-disable-next-line
                    console.log('Form Submitted!');
                    this.$store.dispatch('customer/saveCustomer');
                    return;
                }

                console.log('Correct them errors!');
            });
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
        }
    }
}
</script>

<style scoped>

</style>