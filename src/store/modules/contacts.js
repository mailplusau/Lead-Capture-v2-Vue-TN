import getNSModules from '../../utils/ns-modules';

// let localId = 1;

const state = {
    // For customer's contacts
    contacts: [],
    contactSelectedId: null,
    contactModal: false,
    contactModalTitle: 'Add New Contact',
    contactFormBusy: false,
    contactLoading: true,
    contactForm: {
        internalid: null,
        salutation: '',
        firstname: '',
        lastname: '',
        phone: '',
        email: '',
        contactrole: '',
        title: '',
        company: null, // internal id of customer record
        entityid: '',
        custentity_connect_admin: false,
        custentity_connect_user: false,
    },
}

const getters = {
    all : state => state.contacts,
    modal : state => state.contactModal,
    formBusy : state => state.contactFormBusy,
    loading : state => state.contactLoading,
    modalTitle : state => state.contactModalTitle,
    form : state => state.contactForm,
}

const mutations = {
    setModal : (state, open = true) => { state.contactModal = open; },
}

const actions = {
    init : async context => {
        let NS_MODULES = await getNSModules();

        if (!context.rootGetters['customer/internalId']) {
            context.state.contactLoading = false;
            return;
        }

        _loadContacts(context, NS_MODULES);

        context.state.contactLoading = false;
    },
    openContactModal : (context, contactId) => {
        context.state.contactModalTitle = 'Add a new contact';

        if (contactId) {
            context.state.contactModalTitle = 'Editing contact #' + contactId;

            let index = context.state.contacts.findIndex(item => parseInt(item.internalid) === parseInt(contactId));

            for (let fieldId in context.state.contactForm) {
                context.state.contactForm[fieldId] = context.state.contacts[index][fieldId];
            }
        } else _resetContactForm(context);

        context.state.contactModal = true;
    },
    closeContactModal : context => { context.state.contactModal = false; },
    saveContactForm : context => {
        context.state.contactFormBusy = true;

        setTimeout(async () => {
            let NS_MODULES = await getNSModules();
            context.state.contactForm.entityid = context.state.contactForm.firstname + ' ' + context.state.contactForm.lastname;

            if (context.rootGetters['customer/internalId']) {
                context.state.contactForm.company = context.rootGetters['customer/internalId'];

                _saveContactToNetSuite(NS_MODULES, context.rootGetters['customer/internalId'], context.state.contactForm);
            } else context.state.contacts.push({...context.state.contactForm});

            _loadContacts(context, NS_MODULES);

            context.state.contactFormBusy = false;

            context.state.contactModal = false;
        }, 250);
    }
    
}

/** -- Fields in customsearch_salesp_contacts saved search --
Internal ID internalid
Customer Internal ID internalid
Customer Name companyname
Mr./Mrs... salutation
First Name firstname
Last Name lastname
Name entityid
Phone phone
Email email
Job Title title
Role contactrole
Formula (Text) formulatext
Portal Admin custentity_connect_admin
Portal User custentity_connect_user
MPEX Contact custentity_mpex_contact
 **/
function _loadContacts(context, NS_MODULES) {
    console.log('loading contacts...')

    let contactSearch = NS_MODULES.search.load({
        id: 'customsearch_salesp_contacts',
        type: 'contact'
    });

    contactSearch.filters.push(NS_MODULES.search.createFilter({
        name: 'internalid',
        join: 'CUSTOMER',
        operator: NS_MODULES.search.Operator.ANYOF,
        values: context.rootGetters['customer/internalId']
    }));

    contactSearch.filters.push(NS_MODULES.search.createFilter({
        name: 'isinactive',
        operator: NS_MODULES.search.Operator.IS,
        values: false
    }));

    let result = contactSearch.run();

    context.state.contacts.splice(0);

    result.each((item) => {
        let contactEntry = [];

        for (let fieldId in context.state.contactForm) {
            contactEntry[fieldId] = item.getValue({ name: fieldId });
        }

        context.state.contacts.push(contactEntry);

        return true;
    })
    console.log(context.state.contacts)
}

function _saveContactToNetSuite(NS_MODULES, customerId, contactData) {
    let contactRecord;

    if (contactData.internalid) {
        contactRecord = NS_MODULES.record.load({
            type: NS_MODULES.record.Type.CONTACT,
            id: contactData.internalid,
            isDynamic: true
        });
    } else {
        contactRecord = NS_MODULES.record.create({
            type: NS_MODULES.record.Type.CONTACT,
        });
    }

    for (let fieldId in contactData) {
        if (fieldId === 'custentity_connect_admin' || fieldId === 'custentity_connect_user') {
            if (!contactData[fieldId] || contactData[fieldId] === 3) continue;
        }

        contactRecord.setValue({fieldId, value: contactData[fieldId]});
    }

    contactRecord.save({ignoreMandatoryFields: true});
}

function _resetContactForm(context) {
    for (let fieldId in context.state.contactForm) {
        context.state.contactForm[fieldId] = '';
    }

    context.state.contactForm.company = context.rootGetters['customer/internalId'] || null;
    context.state.contactForm.internalid = null;
}

export default {
    state,
    getters,
    actions,
    mutations
};