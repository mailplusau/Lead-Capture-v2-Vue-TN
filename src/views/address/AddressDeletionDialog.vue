<template>
    <v-dialog v-model="dialogOpen" max-width="550">
        <v-card class="background">
            <v-card-title class="text-h5">
                Delete address #{{$store.getters['addresses/idToDelete']}}?
            </v-card-title>

            <v-card-text class="subtitle-1">
                The address to be deleted contains the following information:
            </v-card-text>
            <v-card-text class="subtitle-2 address-details">
                <p>Full Address: {{address.addr1 + ' ' + address.addr2 + ', ' + address.city + ' ' + address.state + ' ' + address.zip + ' ' + address.country}}</p>
                <p>Label: {{address.label}}</p>
                <p>Addressee: {{address.addressee}}</p>
                <p>Lat: {{address.custrecord_address_lat}}</p>
                <p>Long: {{address.custrecord_address_lon}}</p>
                <p>NCL ID: {{address.custrecord_address_ncl}}</p>
            </v-card-text>
            <v-card-text class="red--text subtitle-1">
                Please confirm that you really want to delete this address. This action cannot be undone.
            </v-card-text>

            <v-divider></v-divider>
            <v-card-actions>
                <v-btn color="red darken-1" text @click="proceed">
                    delete
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn color="green darken-1" text @click="dialogOpen = false">
                    Cancel
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
export default {
    name: "AddressDeletionDialog",
    methods: {
        proceed() {
            this.$store.dispatch('addresses/removeAddress');
        }
    },
    computed: {
        dialogOpen: {
            get() {
                return !!this.$store.getters['addresses/idToDelete'];
            },
            set(val) {
                if (!val) this.$store.commit('addresses/setIdToDelete');
            }
        },
        addressInternalId() {
            return this.$store.getters['addresses/idToDelete'];
        },
        address() {
            let index = this.$store.getters['addresses/all'].data.findIndex(item => item.internalid === this.addressInternalId);
            return index >= 0 ? this.$store.getters['addresses/all'].data[index] : {};
        }
    }
};
</script>

<style scoped>
.address-details > p {
    margin-bottom: 2px;
}
</style>