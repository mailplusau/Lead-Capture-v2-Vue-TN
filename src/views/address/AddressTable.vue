<template>
    <v-row>
        <v-col cols="12">
            <v-data-table :headers="headers" :items="addresses" :loading="busy" no-data-text="No Address to Show" :items-per-page="-1"
                class="elevation-5 background" :hide-default-footer="addresses.length <= 10" loading-text="Loading addresses...">
                <template v-slot:top>
                    <v-toolbar flat dense color="primary" dark>
                        <v-toolbar-title>Customer's Addresses</v-toolbar-title>
                        <v-divider class="mx-4" inset vertical></v-divider>
                        <v-toolbar-title class="caption yellow--text">
                            {{ message }}
                        </v-toolbar-title>

                        <v-spacer></v-spacer>

                        <AddressFormDialog />
                    </v-toolbar>
                </template>

                <template v-slot:item.address="{ item }">
                    {{item.addr1 + ' ' + item.addr2 + ', ' + item.city + ' ' + item.state + ' ' + item.zip}}
                </template>

                <template v-slot:item.shipping="{ item }">
                    <v-icon :color="item.defaultshipping ? 'green' : 'red'">
                        {{ item.defaultshipping ? 'mdi-check' : 'mdi-close'}}
                    </v-icon>
                </template>

                <template v-slot:item.billing="{ item }">
                    <v-icon :color="item.defaultbilling ? 'green' : 'red'">
                        {{ item.defaultbilling ? 'mdi-check' : 'mdi-close'}}
                    </v-icon>
                </template>

                <template v-slot:item.geocoded="{ item }">
                    {{ item.custrecord_address_lat && item.custrecord_address_lon ? 'Yes' : 'No'}}
                </template>

                <template v-slot:item.actions="{ item }">
                    <v-card-actions>
                        <v-btn icon color="primary" @click="editAddress(item.internalid)"><v-icon>mdi-pencil</v-icon></v-btn>
                        <v-btn icon color="red" @click="deleteAddress(item.internalid)"><v-icon>mdi-delete</v-icon></v-btn>
                    </v-card-actions>
                </template>
            </v-data-table>
        </v-col>

        <AddressDeletionDialog />
    </v-row>
</template>

<script>
import AddressFormDialog from '@/views/address/AddressFormDialog';
import AddressDeletionDialog from '@/views/address/AddressDeletionDialog';

export default {
    name: "AddressTable",
    components: {AddressDeletionDialog, AddressFormDialog},
    data: () => ({
        headers: [
            {value: 'address', text: 'Address', align: 'start'},
            {value: 'label', text: 'Label', align: 'center', sortable: false},
            {value: 'shipping', text: 'Default Shipping', align: 'center', sortable: false},
            {value: 'billing', text: 'Default Billing', align: 'center', sortable: false},
            {value: 'geocoded', text: 'Geocoded', align: 'center', sortable: false},
            {value: 'actions', text: '', align: 'end', sortable: false},
        ],
    }),
    methods: {
        editAddress(addressId) {
            this.$store.dispatch('addresses/openDialog', {open: true, addressId});
        },
        deleteAddress(addressId) {
            this.$store.commit('addresses/setIdToDelete', addressId);
        }
    },
    computed: {
        addresses() {
            return this.$store.getters['addresses/all'].data;
        },
        busy() {
            return this.$store.getters['addresses/all'].busy;
        },
        message() {
            let currentShippingAddress = !this.$store.getters['addresses/currentShippingAddress'];
            let currentBillingAddress = !this.$store.getters['addresses/currentBillingAddress'];
            let str = '';
            str += (currentShippingAddress || currentBillingAddress) ? 'Please add ' : '';
            str += (currentShippingAddress) ? 'shipping ' : '';
            str += (currentShippingAddress && currentBillingAddress) ? 'and ' : '';
            str += (currentBillingAddress) ? 'billing ' : '';
            str += (currentShippingAddress || currentBillingAddress) ? 'address.' : '';

            return str;
        }
    }
};
</script>

<style scoped>

</style>