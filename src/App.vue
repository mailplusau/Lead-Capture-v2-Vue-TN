<template>
    <v-app :style="{background: $vuetify.theme.themes[theme].background}">
        <v-main>
            <v-container fluid>
                <v-row class="mx-1" justify="space-between" align="center">
                    <v-col cols="auto">
                        <h1 class="primary--text">
                            {{ $store.getters['pageTitle'] }}
                        </h1>
                    </v-col>

                    <v-col cols="auto">
                        <a v-if="!$store.getters['user/isFranchisee']" @click="$store.dispatch('addShortcut')"
                           class="subtitle-1">Add To Shortcuts <v-icon size="20" color="primary">mdi-open-in-new</v-icon></a>
                    </v-col>
                </v-row>
            </v-container>

            <v-divider class="mb-3"></v-divider>

            <v-container>
                <v-row justify="center">
                    <v-col xl="9" lg="11" cols="12">
                        <CustomerView ref="customerView" />

                        <AddressView class="mb-10" />

                        <ContactView class="mb-10" />

                        <v-btn large block color="success" class="mb-10" elevation="7" v-if="!$store.getters['customer/id']"
                               @click="saveNewCustomer">save new customer</v-btn>

                        <InvoiceView class="mb-10" />

                        <ExtraInfo class="mb-10" />
                    </v-col>
                </v-row>
            </v-container>

        </v-main>

        <GlobalNotificationModal />

        <GlobalSpeedDial v-if="false" />

        <v-btn v-if="$store.getters['customer/id']" title="Go to customer page"
               color="pink" dark fixed bottom
               left :fab="$vuetify.breakpoint.mdAndDown"
               @click="$store.dispatch('customer/goToNetSuitePage')"
        >
            <v-icon>mdi-chevron-left</v-icon>
            {{ $vuetify.breakpoint.mdAndDown ? '' : `Customer's Page` }}
        </v-btn>
    </v-app>
</template>

<script>
import GlobalNotificationModal from "@/components/GlobalNotificationModal";
import CustomerView from "@/views/customer/Main";
import AddressView from "@/views/address/Main";
import ContactView from "@/views/contact/Main";
import InvoiceView from "@/views/invoices/Main";
import ExtraInfo from "@/views/extra-info/Main";
import GlobalSpeedDial from '@/components/GlobalSpeedDial';

export default {
    name: 'App',
    components: {
        GlobalSpeedDial,
        GlobalNotificationModal,
        CustomerView,
        AddressView,
        ContactView,
        InvoiceView,
        ExtraInfo,
    },
    beforeCreate() {
        this.$store.dispatch('init');
    },
    methods: {
        saveNewCustomer() {
            if (this.$refs.customerView.triggerValidation())
                this.$store.dispatch('saveNewCustomer');
        }
    },
    computed:{
        theme(){
            return (this.$vuetify.theme.dark) ? 'dark' : 'light'
        }
    }
};
</script>
