import http from "@/utils/http";
import {VARS} from '@/utils/utils.mjs';

const state = {
    additionalInfo: {
        form: {},
        data: {...VARS.customer.extraInfoFields},
        franchisee: {...VARS.franchisee.basicFields},
        formDisabled: true,
    },

    servicePricing: {
        services: [],
        servicesBusy: false,
        itemPricing: [],
        itemPricingBusy: false,
    },

    mpExInfo: {
        form: {},
        data: {
            custentity_mpex_customer: false, // is MPEX Customer
            custentity_exp_mpex_weekly_usage: null, // MPEX Expected Usage
            custentity_form_mpex_usage_per_week: null, // MPEX Weekly Usage
        },
        formDisabled: true,
        pricingStructures: [],
        weeklyUsageTable: [],
    },

    surveyInfo: {
        form: {},
        data: {
            custentity_category_multisite: null, // is Multisite
            custentity_category_multisite_link: '', // Multisite Link
            custentity_mp_toll_zeevisit: null, // is Visited by Franchisee
            custentity_mp_toll_zeevisit_memo: '', // Franchisee Visit Note
            custentity_ap_mail_parcel: null, // is Using Mail/Parcel/Satchel Regularly
            custentity_customer_express_post: null, // is Using Express Post
            custentity_customer_local_couriers: null, // is Using Local Couriers
            custentity_customer_po_box: null, // is Using PO Box
            custentity_customer_bank_visit: null, // is Using Bank Visit
            custentity_lead_type: null, // Lead Type or Classify Lead
        },
        formDisabled: true,
    },

    userNote: {
        details: {
            internalid: null,
            entity: null, // Customer ID that this belongs to
            direction: null,
            notetype: null,
            note: null, // Message in the note
            notedate: null, // Date Create
            author: null, // Author of this note
            title: 'User Note', // Note's title
        },
        data: [],
        loading: false,
        disabled: false,
        dialog: {
            form: {},
            open: false,
            busy: false,
        },
        directionOptions: [
            {value: 1, text: 'Incoming'},
            {value: 2, text: 'Outgoing'},
        ],
        noteTypeOptions: [
            {value: 3, text: 'Email'},
            {value: 7, text: 'Note'},
            {value: 8, text: 'Phone Call'},
        ],
    }
};

const getters = {
    additionalInfo : state => state.additionalInfo,
    servicePricing : state => state.servicePricing,
    mpExInfo : state => state.mpExInfo,
    surveyInfo : state => state.surveyInfo,
    userNote : state => state.userNote,
};

const mutations = {
    resetAdditionalInfo : state => { state.additionalInfo.form = {...state.additionalInfo.data}; },
    disableAdditionalInfo : (state, disabled = true) => { state.additionalInfo.formDisabled = disabled; },

    resetMpExInfo : state => { state.mpExInfo.form = {...state.mpExInfo.data}; },
    disableMpExInfo : (state, disabled = true) => { state.mpExInfo.formDisabled = disabled; },

    resetSurveyInfo : state => { state.surveyInfo.form = {...state.surveyInfo.data}; },
    disableSurveyInfo : (state, disabled = true) => { state.surveyInfo.formDisabled = disabled; },
};

const actions = {
    init : async context => {
        if (!context.rootGetters['customer/id']) return;

        context.dispatch('getAdditionalInfo').then();
        context.dispatch('initServicePricing').then();
        context.dispatch('getMpExInfo').then();
        context.dispatch('getSurveyInfo').then();
        context.dispatch('getUserNotes').then();
    },

    getAdditionalInfo : async context => {
        let integerFields = ['terms'];
        let fieldIds = [];
        for (let fieldId in context.state.additionalInfo.data) fieldIds.push(fieldId);

        let {franchiseeData, customerData} = await http.get('getCustomerDetails', {
            customerId: context.rootGetters['customer/id'],
            fieldIds,
            includesFranchisee: true
        });

        for (let fieldId in context.state.additionalInfo.data)
            context.state.additionalInfo.data[fieldId] = integerFields.includes(fieldId) ? parseInt(customerData[fieldId]) : customerData[fieldId];

        for (let fieldId in context.state.additionalInfo.franchisee)
            context.state.additionalInfo.franchisee[fieldId] = franchiseeData[fieldId];

        context.commit('resetAdditionalInfo');
        context.state.additionalInfo.formDisabled = true;

    },
    saveAdditionalInfo : async context => {
        if (!context.rootGetters['customer/id']) return;

        context.commit('displayBusyGlobalModal', {title: 'Processing', message: 'Saving customer\'s details. Please wait...'}, {root: true});

        let fieldIds = [];
        for (let fieldId in context.state.additionalInfo.form) fieldIds.push(fieldId);

        let data = await http.post('saveCustomerDetails', {
            customerId: context.rootGetters['customer/id'],
            customerData: {...context.state.additionalInfo.form},
            fieldIds,
        });

        for (let fieldId in context.state.additionalInfo.data)
            context.state.additionalInfo.data[fieldId] = data[fieldId];

        context.commit('resetAdditionalInfo');
        context.state.additionalInfo.formDisabled = true;
        context.commit('displayInfoGlobalModal', {title: 'Complete', message: 'Customer\'s details have been saved.'}, {root: true});
    },

    initServicePricing : async context => {
        await Promise.allSettled([
            _getAssignedServices(context),
            _getItemPricing(context)
        ])
    },

    getMpExInfo : async context => {
        let fieldIds = [];
        for (let fieldId in context.state.mpExInfo.data) fieldIds.push(fieldId);

        let customerData = await http.get('getCustomerDetails', {
            customerId: context.rootGetters['customer/id'],
            fieldIds,
        });

        for (let fieldId in context.state.mpExInfo.data)
            context.state.mpExInfo.data[fieldId] = customerData[fieldId];

        context.commit('resetMpExInfo');
        context.state.mpExInfo.formDisabled = true;

        // Get Pricing Structure
        context.state.mpExInfo.pricingStructures =  await http.get('getProductPricing', {
            customerId: context.rootGetters['customer/id'],
        });

        // Get MPEX - Weekly Usage
        context.state.mpExInfo.weeklyUsageTable =  await http.get('getMpExWeeklyUsage', {
            customerId: context.rootGetters['customer/id'],
        });
    },
    saveMpExInfo : async context => {
        if (!context.rootGetters['customer/id']) return;

        context.commit('displayBusyGlobalModal', {title: 'Processing', message: 'Saving customer\'s details. Please wait...'}, {root: true});

        let fieldIds = [];
        for (let fieldId in context.state.mpExInfo.form) fieldIds.push(fieldId);

        let data = await http.post('saveCustomerDetails', {
            customerId: context.rootGetters['customer/id'],
            customerData: {...context.state.mpExInfo.form},
            fieldIds,
        });

        for (let fieldId in context.state.mpExInfo.data)
            context.state.mpExInfo.data[fieldId] = data[fieldId];

        context.commit('resetMpExInfo');
        context.state.mpExInfo.formDisabled = true;
        context.commit('displayInfoGlobalModal', {title: 'Complete', message: 'Customer\'s details have been saved.'}, {root: true});
    },

    getSurveyInfo : async context => {
        let fieldIds = [];
        for (let fieldId in context.state.surveyInfo.data) fieldIds.push(fieldId);

        let customerData = await http.get('getCustomerDetails', {
            customerId: context.rootGetters['customer/id'],
            fieldIds,
        });

        for (let fieldId in context.state.surveyInfo.data)
            context.state.surveyInfo.data[fieldId] = customerData[fieldId];

        context.commit('resetSurveyInfo');
        context.state.surveyInfo.formDisabled = true;

    },
    saveSurveyInfo : async context => {
        if (!context.rootGetters['customer/id']) return;

        context.commit('displayBusyGlobalModal', {title: 'Processing', message: 'Saving survey information. Please wait...'}, {root: true});

        let fieldIds = [];
        for (let fieldId in context.state.surveyInfo.form) fieldIds.push(fieldId);

        let data = await http.post('saveCustomerDetails', {
            customerId: context.rootGetters['customer/id'],
            customerData: {...context.state.surveyInfo.form},
            fieldIds,
        });

        for (let fieldId in context.state.surveyInfo.data)
            context.state.surveyInfo.data[fieldId] = data[fieldId];

        context.commit('resetSurveyInfo');
        context.state.surveyInfo.formDisabled = true;
        context.commit('displayInfoGlobalModal', {title: 'Complete', message: 'Survey information has been saved.'}, {root: true});

        // TODO: custentity_mp_toll_zeevisit_memo is a Date type
        // TODO: custentity_category_multisite_link must be a URL format
    },

    getUserNotes : async context => {
        context.state.userNote.loading = true;

        let data = await http.get('getUserNotes', {
            customerId: context.rootGetters['customer/id'],
        });

        context.state.userNote.data = [...data];
        state.userNote.dialog.form = {...state.userNote.details};
        context.state.userNote.loading = false;
    },
    createUserNote : async context => {
        if (!context.rootGetters['customer/id']) return;

        context.commit('displayBusyGlobalModal', {title: 'Processing', message: 'Saving user note. Please wait...'}, {root: true});
        context.state.userNote.dialog.open = false;

        await http.post('createUserNote', {
            customerId: context.rootGetters['customer/id'],
            noteData: context.state.userNote.dialog.form
        });

        await context.dispatch('getUserNotes');

        context.state.userNote.dialog.form = {...context.state.userNote.details};
        context.commit('displayInfoGlobalModal', {title: 'Complete', message: 'A new user note has been created.'}, {root: true});
    }
};

async function _getAssignedServices(context) {
    context.state.servicePricing.servicesBusy = true;

    let data = await http.get('getAssignedServices', {
        customerId: context.rootGetters['customer/id'],
    });

    context.state.servicePricing.services = [...data];

    context.state.servicePricing.servicesBusy = false;
}

async function _getItemPricing(context) {
    context.state.servicePricing.itemPricingBusy = true;

    let data = await http.get('getItemPricing', {
        customerId: context.rootGetters['customer/id'],
    });

    context.state.servicePricing.itemPricing = [...data];

    context.state.servicePricing.itemPricingBusy = false;
}

export default {
    state,
    getters,
    actions,
    mutations
};