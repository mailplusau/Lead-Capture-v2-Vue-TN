<template>
    <v-dialog v-model="dialogOpen" :width="dialogWidth" :persistent="formBusy" eager>
        <template v-slot:activator="{ on, attrs }">
            <v-btn color="success" small :disabled="addressesLoading"
                   v-bind="attrs" v-on="on">
                add address
            </v-btn>
        </template>

        <v-card class="background">
            <AddressForm ref="addressForm" />

            <v-card-actions class="pb-5">
                <v-spacer></v-spacer>
                <v-btn color="red darken-1" dark class="mx-3" @click="dialogOpen = false" :disabled="formBusy">
                    Cancel
                </v-btn>
                <v-btn color="green darken-1" dark class="mx-3" @click="save" :disabled="formBusy">
                    Save
                </v-btn>
                <v-spacer></v-spacer>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
import AddressForm from '@/views/address/AddressForm.vue';

export default {
    name: "AddressFormDialog",
    components: {AddressForm},
    data: () => ({
        valid: true,
    }),
    methods: {
        save() {
            if (!this.$refs.addressForm.save()) return;
            this.dialogOpen = false;
        },
    },
    computed: {
        form() {
            return this.$store.getters['addresses/dialog'].form;
        },
        formBusy() {
            return this.$store.getters['addresses/dialog'].busy;
        },
        addressesLoading() {
            return this.$store.getters['addresses/all'].busy;
        },
        dialogOpen: {
            get() {
                return this.$store.getters['addresses/dialog'].open;
            },
            set(val) {
                this.$store.dispatch('addresses/openDialog', {open: val});
            }
        },
        dialogWidth() {
            if (this.$vuetify.breakpoint.smAndDown)
                return '95vw';
            else if (this.$vuetify.breakpoint.md)
                return '75vw';
            else if (this.$vuetify.breakpoint.lg)
                return '60vw';
            else
                return '40vw';
        }
    },
};
</script>

<style scoped>

</style>