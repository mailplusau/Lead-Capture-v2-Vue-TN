<template>
    <div class="col-lg-6 col-12">

        <h1 class="text-center mp-header">Addresses</h1>

        <AddressTable />

        <p class="text-danger" v-show="!!addressMissingWarningText && !addressFormBusy" v-html="addressMissingWarningText"></p>

        <div class="row mb-2">
            <div class="col-12">
                <b-button block variant="outline-primary" size="sm"
                          @click="$store.dispatch('addresses/openAddressModal')"
                          :disabled="addressFormBusy || loading">
                    Add Address
                </b-button>
            </div>
        </div>

        <AddressFormModal />

    </div>
</template>

<script>
import AddressTable from "./AddressTableV2";
import AddressFormModal from "./AddressFormModal";

export default {
    name: "Main",
    components: {AddressFormModal, AddressTable},
    computed: {
        loading() {
            return this.$store.getters['addresses/loading'];
        },
        addressFormBusy() {
            return this.$store.getters['addresses/formBusy'];
        },
        addressMissingWarningText() {
            let str = '';
            let control = 0;

            if (!this.$store.getters['addresses/shippingAddressAdded']) {
                str += '<b>1 default shipping</b>';
                control++;
            }

            if (!this.$store.getters['addresses/billingAddressAdded']) {
                str += (control ? ' and ' : '') + '<b>1 default billing</b>';
                control++;
            }

            if (control) str += ' address required!';

            return str;
        },
    },
}
</script>

<style scoped>
    .address-warning {
        color: #103d39;
        font-weight: bold;
    }
</style>