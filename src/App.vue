<template>
    <div id="app" class="container">
        <CustomerDetails ref="customerDetails"/>

        <div class="row justify-content-center align-items-stretch mt-3">
            <CustomerAddresses />

            <CustomerContacts />
        </div>

        <div class="row mt-4" v-if="!$store.getters['customer/internalId'] && !$store.getters['customer/busy']">
            <b-button block @click="saveNewCustomer" variant="success">Save</b-button>
        </div>
    </div>
</template>

<script>
import CustomerDetails from "./components/CustomerDetails";
import CustomerAddresses from "./components/CustomerAddresses";
import CustomerContacts from "./components/CustomerContacts";

export default {
    name: 'App',
    components: {CustomerContacts, CustomerAddresses, CustomerDetails},
    async beforeCreate() {
        await this.$store.dispatch('init');
    },
    mounted() {
        this.registerCustomValidationRules();
    },
    methods: {
        registerCustomValidationRules() {
            this.$validator.extend('aus_phone', {
                getMessage(field) {
                    return `the ${field} field must be a valid Australian phone number.`;
                },
                validate(value) {
                    let australiaPhoneFormat = /^(\+\d{2}[ -]{0,1}){0,1}(((\({0,1}[ -]{0,1})0{0,1}\){0,1}[2|3|7|8]{1}\){0,1}[ -]*(\d{4}[ -]{0,1}\d{4}))|(1[ -]{0,1}(300|800|900|902)[ -]{0,1}((\d{6})|(\d{3}[ -]{0,1}\d{3})))|(13[ -]{0,1}([\d -]{5})|((\({0,1}[ -]{0,1})0{0,1}\){0,1}4{1}[\d -]{8,10})))$/;
                    return australiaPhoneFormat.test(value);
                }
            });
        },
        saveNewCustomer() {
            this.$refs.customerDetails.commitDetails();
        }
    }
}
</script>

<style>
#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
}
.custom-select {
    position: relative;
    flex: 1 1 auto;
    width: 1%;
    min-width: 0;
    font-size: 13px;
}
.pac-container {
    z-index: 1100 !important;
}
body.modal-open {
    overflow: hidden !important;
}

</style>
