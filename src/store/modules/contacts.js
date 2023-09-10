import http from "@/utils/http";
import {VARS} from "@/utils/utils.mjs";

let localId = 1;

const state = {
    idToDelete: null,
    contacts: {
        data: [],
        busy: false,
    },
    dialog: {
        title: '',
        form: {},
        busy: false,
        open: false,
    },
    contact: {...VARS.contactFields},
};

const getters = {
    all : state => state.contacts,
    dialog : state => state.dialog,
    idToDelete : state => state.idToDelete,
};

const mutations = {
    setDialog : (state, open = true) => { state.dialog.open = open; },
    setIdToDelete : (state, id = null) => { state.idToDelete = id; },
    resetDialogForm : state => { state.dialog.form = {...state.contact}; }
};

const actions = {
    init : async context => {
        if (!context.rootGetters['customer/id'])
            return await context.dispatch('restoreStateFromLocalStorage');

        await _fetchContacts(context);
    },
    openDialog : (context, {open = true, contactId = null}) => {
        context.state.dialog.open = open;

        if (open) {
            let index = context.state.contacts.data.findIndex(item => item.internalid === contactId);
            context.state.dialog.busy = true;
            context.state.dialog.title = index >= 0 ? `Edit Contact Id #${contactId}` : 'Add Contact';

            if (index >= 0) // Index exists, edit mode
                context.state.dialog.form = {...context.state.contacts.data[index]};
            else {
                context.state.dialog.form = {...context.state.contact};
                if (!context.state.contacts.data.length) // If there are no existing contact, set as Primary Contact (-10)
                    context.state.dialog.form.contactrole = '-10';
            }
            
            context.state.dialog.busy = false;
        }
    },
    handleContactRoleChanged : context => {
        if ([5, 6, 8].includes(parseInt(context.state.dialog.form.contactrole))) { // if role is Mail/Parcel Operator, MPEX contact or Product Contact
            if (parseInt(context.state.dialog.form.custentity_connect_user) !== 1) // then set Portal User to Yes (1)
                context.state.dialog.form.custentity_connect_user = 1;

            // find at least 1 contact that is Portal Admin (1)
            let index = context.state.contacts.data.findIndex(item => parseInt(item.custentity_connect_admin) === 1);

            // and if there's no contact set as Portal Admin (1), set this to Yes as well
            if (index < 0) context.state.dialog.form.custentity_connect_admin = 1;
        }
    },
    save : async context => {
        context.commit('displayBusyGlobalModal', {title: 'Processing', message: 'Saving contact. Please wait...'}, {root: true});

        // Set default value
        context.state.dialog.form.entityid = context.state.dialog.form.firstname + ' ' + context.state.dialog.form.lastname;
        if (context.rootGetters['customer/id'])
            context.state.dialog.form.company = context.rootGetters['customer/id'];

        if (context.rootGetters['customer/id'])
            await _saveContact.toNetSuite(context);
        else await _saveContact.toLocal(context);

        context.commit('closeGlobalModal', null, {root: true});
    },
    remove : async context => {
        let contactInternalId = context.state.idToDelete;

        if (!contactInternalId) return;

        context.state.idToDelete = null;

        context.commit('displayBusyGlobalModal', {title: 'Processing', message: 'Removing contact. Please wait...'}, {root: true});

        if (context.rootGetters['customer/id']) {
            await http.post('setContactAsInactive', { contactInternalId });

            await _fetchContacts(context);
        } else {
            let index = context.state.contacts.data.findIndex(item => item.internalid === contactInternalId);
            if (index >= 0) context.state.contacts.data.splice(index, 1);
        }

        await context.dispatch('saveStateToLocalStorage');

        context.commit('displayInfoGlobalModal', {title: 'Complete', message: 'Contact has been deleted.'}, {root: true});
    },

    saveStateToLocalStorage : async context => {
        top.localStorage.setItem("1763_contacts", JSON.stringify(context.state.contacts.data));
    },
    clearStateFromLocalStorage : async () => {
        top.localStorage.removeItem("1763_contacts");
    },
    restoreStateFromLocalStorage : async context => {
        if (context.rootGetters['customer/id'] !== null) return;

        try {
            let data = JSON.parse(top.localStorage.getItem("1763_contacts"));
            if (Array.isArray(data)) context.state.contacts.data = [...data];
        } catch (e) {
            console.log('No stored data found')
        }
    }
};

mutations.resetDialogForm(state);

async function _fetchContacts(context) {
    if (!context.rootGetters['customer/id']) return;

    context.state.contacts.busy = true;
    let data = await http.get('getCustomerContacts', {
        customerId: context.rootGetters['customer/id']
    });

    context.state.contacts.data = [...data];
    context.state.contacts.busy = false;
}

const _saveContact = {
    async toNetSuite(context) {
        let contactData = {};

        for (let field in context.state.contact)
            contactData[field] = context.state.dialog.form[field];

        await http.post('saveContact', {contactData});

        await _fetchContacts(context);
    },
    async toLocal(context) {
        context.state.dialog.form.email = context.state.dialog.form.email || 'abc@abc.com';

        if (context.state.dialog.form.internalid !== null && context.state.dialog.form.internalid >= 0) {
            let currentIndex = context.state.contacts.data.findIndex(item => item.internalid === context.state.dialog.form.internalid);
            context.state.contacts.data.splice(currentIndex, 1, {...context.state.dialog.form});
        } else context.state.contacts.data.push({...context.state.dialog.form, internalid: localId++});

        context.commit('resetDialogForm');

        await context.dispatch('saveStateToLocalStorage');
    }
}

export default {
    state,
    getters,
    actions,
    mutations
};