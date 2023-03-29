<template>
    <div class="col-lg-6 col-12">

        <h1 class="text-center mp-header">Addresses</h1>

        <AddressTable />

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
    },
}
</script>

<style scoped>
    .address-warning {
        color: #103d39;
        font-weight: bold;
    }
</style>