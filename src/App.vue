<template>
    <div id="app" class="container">
        <CustomerDetails ref="customerDetails"/>

        <div class="row">
            <div class="col-6">

            </div>
        </div>

        <div class="row" v-if="!!$store.getters['customer/internalId']">
            <b-button block @click="saveCustomer">Save</b-button>
        </div>
    </div>
</template>

<script>
import CustomerDetails from "./components/CustomerDetails";

export default {
    name: 'App',
    components: {CustomerDetails},
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
        saveCustomer() {
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
</style>
