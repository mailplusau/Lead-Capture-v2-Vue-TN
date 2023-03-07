import getNSModules from '../../utils/ns-modules';

let localId = 1;

const state = {
    addresses: [],
    addressSelectedId: null,
    addressModal: false,
    addressModalTitle: '',
    addressFormBusy: false,
    addressLoading: true,
    addressForm: {
        addr1: '',
        addr2: '',
        city: '',
        state: '',
        zip: '',
        country: 'AU',
        addressee: '', // company name
        custrecord_address_lat: '',
        custrecord_address_lon: '',
        custrecord_address_ncl: '',
    },
    addressSublistForm: {
        internalid: '',
        label: '',
        defaultshipping: false,
        defaultbilling: false,
        isresidential: false,
    },
    addressFormValid: false,
    addressFormDisabled: true,

    shippingAddressAdded: null,
    billingAddressAdded: null,
}

const getters = {
    all : state => state.addresses,
    loading : state => state.addressLoading,
    modal : state => state.addressModal,
    selectedId : state => state.addressSelectedId,
    modalTitle : state => state.addressModalTitle,
    form : state => state.addressForm,
    sublistForm : state => state.addressSublistForm,
    formBusy : state => state.addressFormBusy,
    shippingAddressAdded : state => state.shippingAddressAdded,
    billingAddressAdded : state => state.billingAddressAdded,
}

const mutations = {
    setModal : (state, open = true) => { state.addressModal = open; },
    handleAddressFormChange : (state, googlePlace) => {
        state.addressForm.custrecord_address_lat = googlePlace.geometry.location.lat();
        state.addressForm.custrecord_address_lon = googlePlace.geometry.location.lng();

        let address2 = "";

        for (let addressComponent of googlePlace.address_components) {

            if (addressComponent.types[0] === 'street_number' || addressComponent.types[0] === 'route') {
                address2 += addressComponent['short_name'] + " ";
                state.addressForm.addr2 = address2;
            }
            if (addressComponent.types[0] === 'postal_code') {
                state.addressForm.zip = addressComponent['short_name'];
            }
            if (addressComponent.types[0] === 'administrative_area_level_1') {
                state.addressForm.state = addressComponent['short_name'];
            }
            if (addressComponent.types[0] === 'locality') {
                state.addressForm.city = addressComponent['short_name'];
            }
        }
    }
}

const actions = {
    init : async context => {
        let NS_MODULES = await getNSModules();

        if (!context.rootGetters['customer/internalId']) {
            context.state.addressLoading = false;
            return;
        }

        _loadAddresses(context, NS_MODULES);

        _checkBillingAndShippingAddress(context)

        context.state.addressLoading = false;
    },
    openAddressModal : (context, addressId) => {
        console.log(addressId);
        context.state.addressModalTitle = 'Add a new address'

        if (addressId) {
            context.state.addressModalTitle = 'Editing address #' + addressId;

            let index = context.state.addresses.findIndex(item => parseInt(item.internalid) === parseInt(addressId));

            for (let fieldId in context.state.addressForm) {
                context.state.addressForm[fieldId] = context.state.addresses[index][fieldId];
            }

            for (let fieldId in context.state.addressSublistForm) {
                context.state.addressSublistForm[fieldId] = context.state.addresses[index][fieldId];
            }
        } else _resetAddressForm(context);

        context.state.addressModal = true;
    },
    closeAddressModal : context => { context.state.addressModal = false; },
    saveAddressForm : async context => {
        context.state.addressFormBusy = true;

        setTimeout(async () => {
            if (context.rootGetters['customer/internalId']) { // Existing customer, we just add new or edit existing address
                let NS_MODULES = await getNSModules();

                _updateDefaultShippingAndBillingAddress(NS_MODULES, context, context.rootGetters['customer/internalId'], {...context.state.addressSublistForm});

                _saveAddressToNetSuite(NS_MODULES, context, context.rootGetters['customer/internalId'], {...context.state.addressForm, ...context.state.addressSublistForm});

                _loadAddresses(context, NS_MODULES);

                _checkBillingAndShippingAddress(context);
            } else { // New customer, save their addresses to the in-memory array for now
                if (context.state.addressSublistForm.defaultshipping && context.state.shippingAddressAdded !== context.state.addressSublistForm.internalid) {
                    let index = context.state.addresses.findIndex(item => item.internalid === context.state.shippingAddressAdded);
                    if (index >= 0) context.state.addresses[index].defaultshipping = false;
                }
                if (context.state.addressSublistForm.defaultbilling && context.state.billingAddressAdded !== context.state.addressSublistForm.internalid) {
                    let index = context.state.addresses.findIndex(item => item.internalid === context.state.billingAddressAdded);
                    if (index >= 0) context.state.addresses[index].defaultbilling = false;
                }

                if (context.state.addressSublistForm.internalid) { // we still have local id for these addresses to make it easy to edit them
                    let index = context.state.addresses.findIndex(item => item.internalid === context.state.addressSublistForm.internalid);
                    context.state.addresses.splice(index, 1, {
                        ...context.state.addressForm,
                        ...context.state.addressSublistForm,
                    })
                } else {
                    context.state.addresses.push({
                        ...context.state.addressForm,
                        ...context.state.addressSublistForm,
                        internalid: localId
                    });

                    localId++;
                }

                _checkBillingAndShippingAddress(context);
            }
            context.state.addressFormBusy = false;

            context.state.addressModal = false;
        }, 250)
    }
}

function _resetAddressForm(context) {
    for (let fieldId in context.state.addressForm) {
        context.state.addressForm[fieldId] = '';
    }

    if (context.rootGetters['customer/internalId'])
        context.state.addressForm.addressee = context.rootGetters['customer/details'].companyname || '';
    
    context.state.addressForm.country = 'AU';

    context.state.addressSublistForm.label = '';
    context.state.addressSublistForm.internalid = null;
    context.state.addressSublistForm.defaultshipping = false;
    context.state.addressSublistForm.defaultbilling = false;
    context.state.addressSublistForm.isresidential = false;
}

function _loadAddresses(context, NS_MODULES) {
    console.log('loading addresses...');
    context.state.addresses.splice(0);

    let customerRecord = NS_MODULES.record.load({
        type: NS_MODULES.record.Type.CUSTOMER,
        id: context.rootGetters['customer/internalId'],
        isDynamic: true
    });

    let lineCount = customerRecord.getLineCount({sublistId: 'addressbook'});

    for (let line = 0; line < lineCount; line++) {
        customerRecord.selectLine({sublistId: 'addressbook', line});
        let entry = {};

        console.log(customerRecord.getCurrentSublistText({sublistId: 'addressbook', fieldId: 'custrecord_address_ncl'}))
        for (let fieldId in context.state.addressSublistForm) {
            entry[fieldId] = customerRecord.getCurrentSublistValue({sublistId: 'addressbook', fieldId})
        }

        let addressSubrecord = customerRecord.getCurrentSublistSubrecord({sublistId: 'addressbook', fieldId: 'addressbookaddress'});
        for (let fieldId in context.state.addressForm) {
            entry[fieldId] = addressSubrecord.getValue({ fieldId })
        }

        context.state.addresses.push(entry);
    }
}

function _saveAddressToNetSuite(NS_MODULES, context, customerId, addressData) {
    let customerRecord = NS_MODULES.record.load({
        type: NS_MODULES.record.Type.CUSTOMER,
        id: customerId,
        isDynamic: true
    });
    // Select an existing or create a new line the customerRecord's sublist
    if (addressData.internalid) { // Edit existing address
        let line = customerRecord.findSublistLineWithValue({sublistId: 'addressbook', fieldId: 'internalid', value: addressData.internalid});
        customerRecord.selectLine({sublistId: 'addressbook', line});
    } else { // Save new address
        customerRecord.selectNewLine({sublistId: 'addressbook'});
    }

    // Fill the sublist's fields using property names of context.state.addressSublistForm as reference
    for (let fieldId in context.state.addressSublistForm) {
        if (fieldId === 'internalid') continue; // we skip over internalid, not sure if this is necessary
        customerRecord.setCurrentSublistValue({sublistId: 'addressbook', fieldId, value: addressData[fieldId]});
    }

    // Load the addressbookaddress subrecord of the currently selected sublist line
    let addressSubrecord = customerRecord.getCurrentSublistSubrecord({sublistId: 'addressbook', fieldId: 'addressbookaddress'});

    // Fill the subrecord's fields using property names of context.state.addressForm as reference
    for (let fieldId in context.state.addressForm) {
        addressSubrecord.setValue({fieldId, value: addressData[fieldId]});
    }

    // Commit the line
    customerRecord.commitLine({sublistId: 'addressbook'});

    // Save customer record
    customerRecord.save({ignoreMandatoryFields: true});

}

function _updateDefaultShippingAndBillingAddress(NS_MODULES, context, customerId, addressSublistForm) {
    if (addressSublistForm.defaultshipping && context.state.shippingAddressAdded !== addressSublistForm.internalid && context.state.shippingAddressAdded !== null) {
        // strip defaultshipping from old address
        let customerRecord = NS_MODULES.record.load({
            type: NS_MODULES.record.Type.CUSTOMER,
            id: customerId,
            isDynamic: true
        });
        let line = customerRecord.findSublistLineWithValue({sublistId: 'addressbook', fieldId: 'internalid', value: context.state.shippingAddressAdded});
        customerRecord.selectLine({sublistId: 'addressbook', line});
        customerRecord.setCurrentSublistValue({sublistId: 'addressbook', fieldId: 'defaultshipping', value: false});
        customerRecord.commitLine({sublistId: 'addressbook'});
        customerRecord.save({ignoreMandatoryFields: true});
    }
    if (addressSublistForm.defaultbilling && context.state.billingAddressAdded !== addressSublistForm.internalid && context.state.billingAddressAdded !== null) {
        let customerRecord = NS_MODULES.record.load({
            type: NS_MODULES.record.Type.CUSTOMER,
            id: customerId,
            isDynamic: true
        });
        let line = customerRecord.findSublistLineWithValue({sublistId: 'addressbook', fieldId: 'internalid', value: context.state.billingAddressAdded});
        customerRecord.selectLine({sublistId: 'addressbook', line});
        customerRecord.setCurrentSublistValue({sublistId: 'addressbook', fieldId: 'defaultbilling', value: false});
        customerRecord.commitLine({sublistId: 'addressbook'});
        customerRecord.save({ignoreMandatoryFields: true});
    }
}

function _checkBillingAndShippingAddress(context) {
    let shippingAddresses = context.state.addresses.filter(item => item.defaultshipping === true);
    context.state.shippingAddressAdded = shippingAddresses.length ? shippingAddresses[0].internalid : null;

    let billingAddresses = context.state.addresses.filter(item => item.defaultbilling === true);
    context.state.billingAddressAdded = billingAddresses.length ? billingAddresses[0].internalid : null;

    console.log(context.state.shippingAddressAdded + ' ' + context.state.billingAddressAdded)
}


export default {
    state,
    getters,
    actions,
    mutations
};