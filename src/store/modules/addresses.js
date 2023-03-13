import getNSModules from '../../utils/ns-modules';

let localId = 1;
let _loadPostalLocationsRunning = false;

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
    addressType: 'street',
    addressTypes: {
        street: 'Street Address',
        postal: 'Postal Address'
    },

    postalState: 0,
    postalLocations: [],
    postalLocationForm: {
        name: '',
        internalid: '',
        custrecord_ap_lodgement_addr1: '',
        custrecord_ap_lodgement_addr2: '',
        custrecord_ap_lodgement_lat: '',
        custrecord_ap_lodgement_long: '',
        custrecord_ap_lodgement_postcode: '',
        custrecord_ap_lodgement_site_phone: '',
        custrecord_ap_lodgement_site_state: '', // getText for this one
        custrecord_ap_lodgement_suburb: '',
        custrecord_ap_lodgement_supply: false,
        custrecord_ncl_monthly_fee: '',
        custrecord_ncl_site_access_code: '',
        custrecord_noncust_location_type: '', // getText for this one too
    },
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
    type : state => state.addressType,
    types : state => {
        let arr = [];
        for (const addressTypesKey in state.addressTypes) {
            arr.push({value: addressTypesKey, text: state.addressTypes[addressTypesKey]})
        }
        return arr;
    },
    postalState : state => state.postalState,
    postalLocations : state => state.postalLocations.map(item => ({value: item.internalid, text: item.name})),
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
    },
    setType : (state, type) => {
        // make sure this does not get triggered twice because it will soft-reset the pre-filled data by openAddressModal
        if (state.addressTypes[type] && type !== state.addressType) {
            state.addressType = type;

            // Also do a soft reset of address form
            for (let fieldId in state.addressForm) {
                if (fieldId === 'country') {
                    state.addressForm[fieldId] = 'AU';
                } else if (fieldId !== 'addressee') // Don't reset addressee
                    state.addressForm[fieldId] = '';
            }
        }
    },
    setPostalState : (state, stateIndex) => { state.postalState = stateIndex; }
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
        context.state.addressModalTitle = 'Add a new address'

        if (addressId) {
            context.state.addressModalTitle = 'Editing address #' + addressId;
            context.state.addressFormBusy = true;

            let index = context.state.addresses.findIndex(item => parseInt(item.internalid) === parseInt(addressId));

            let shouldWait = false;
            if (context.state.addresses[index].custrecord_address_ncl) {
                let i = context.rootGetters['states'].findIndex(item => item.text === context.state.addresses[index].state);
                context.commit('setType', 'postal');
                context.state.postalState = i >= 0 ? context.rootGetters['states'][i].value : 0;
                shouldWait = true;
            } else {
                context.commit('setType', 'street');
                shouldWait = false;
            }

            let tempFunc = () => {
                for (let fieldId in context.state.addressForm) {
                    context.state.addressForm[fieldId] = context.state.addresses[index][fieldId];
                }

                for (let fieldId in context.state.addressSublistForm) {
                    context.state.addressSublistForm[fieldId] = context.state.addresses[index][fieldId];
                }
                context.state.addressFormBusy = false;
            }

            // we have to put this block of code in setInterval and wait for handlePostalStateChanged
            // to populate postalLocations array. Otherwise, we will run into issues with race condition
            if (shouldWait) {
                let timer = setInterval(() => {
                    if (!_loadPostalLocationsRunning) {
                        tempFunc();
                        clearInterval(timer);
                    }
                }, 250);
            } else tempFunc();

        } else _resetAddressForm(context);

        context.state.addressModal = true;
    },
    closeAddressModal : context => { context.state.addressModal = false; },
    saveAddressForm : async context => {
        context.state.addressFormBusy = true;

        setTimeout(async () => {
            _setAddressLabel(context.state.addressSublistForm) // Set address label for current address in the form

            if (context.rootGetters['customer/internalId']) { // Existing customer, we just add new or edit existing address
                let NS_MODULES = await getNSModules();

                _updateDefaultShippingAndBillingAddress(NS_MODULES, context, context.rootGetters['customer/internalId'], {...context.state.addressSublistForm});

                _saveAddressToNetSuite(NS_MODULES, context, context.rootGetters['customer/internalId'], {...context.state.addressForm, ...context.state.addressSublistForm});

                _loadAddresses(context, NS_MODULES);

                _checkBillingAndShippingAddress(context);
            } else { // New customer, save their addresses to the in-memory array for now
                if (context.state.addressSublistForm.defaultshipping && context.state.shippingAddressAdded !== context.state.addressSublistForm.internalid) {
                    let index = context.state.addresses.findIndex(item => item.internalid === context.state.shippingAddressAdded);
                    if (index >= 0) {
                        context.state.addresses[index].defaultshipping = false;
                        _setAddressLabel(context.state.addresses[index]); // Update label because default shipping address has changed
                    }
                }
                if (context.state.addressSublistForm.defaultbilling && context.state.billingAddressAdded !== context.state.addressSublistForm.internalid) {
                    let index = context.state.addresses.findIndex(item => item.internalid === context.state.billingAddressAdded);
                    if (index >= 0) {
                        context.state.addresses[index].defaultbilling = false;
                        _setAddressLabel(context.state.addresses[index]); // Update label because default billing address has changed
                    }
                }

                if (context.state.addressSublistForm.internalid) { // we still have local id for these addresses to make it easy to edit them
                    let index = context.state.addresses.findIndex(item => item.internalid === context.state.addressSublistForm.internalid);
                    context.state.addresses.splice(index, 1, {
                        ...context.state.addressForm,
                        ...context.state.addressSublistForm,
                        internalid: context.state.addressSublistForm.internalid
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
        }, 200)
    },
    removeAddress : (context, addressInternalId) => {

        context.state.addressFormBusy = true;

        return new Promise(resolve => {
            setTimeout(async () => {
                if (context.rootGetters['customer/internalId']) {
                    let NS_MODULES = await getNSModules();

                    _removeAddressFromNetSuite(NS_MODULES, context.rootGetters['customer/internalId'], addressInternalId);

                    _loadAddresses(context, NS_MODULES);
                } else {
                    // delete from local memory
                    let index = context.state.addresses.findIndex(item => item.internalid === addressInternalId);

                    if (index >= 0) context.state.addresses.splice(index, 1);
                }

                _checkBillingAndShippingAddress(context);

                context.state.addressFormBusy = false;

                resolve();
            }, 250);
        })
    },
    handlePostalStateChanged : (context, stateIndex) => {
        context.state.addressFormBusy = true;
        _loadPostalLocationsRunning = true;

        setTimeout(async () => {
            let NS_MODULES = await getNSModules();

            _loadPostalLocations(context, NS_MODULES, stateIndex);

            context.state.addressFormBusy = false;
            _loadPostalLocationsRunning = false;
        }, 200);
    },
    handlePostalLocationChanged : (context, postalLocationInternalId) => {
        let index = context.state.postalLocations.findIndex(item => item.internalid === postalLocationInternalId);

        if (index < 0) return;

        let postalLocation = context.state.postalLocations[index];
        context.state.addressForm.state = postalLocation.custrecord_ap_lodgement_site_state;
        context.state.addressForm.city = postalLocation.custrecord_ap_lodgement_suburb;
        context.state.addressForm.zip = postalLocation.custrecord_ap_lodgement_postcode;
        context.state.addressForm.custrecord_address_lat = postalLocation.custrecord_ap_lodgement_lat;
        context.state.addressForm.custrecord_address_lon = postalLocation.custrecord_ap_lodgement_long;
        context.state.addressForm.custrecord_address_ncl = postalLocation.internalid;
    }
}

function _resetAddressForm(context) {
    console.log('resetting address form')
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

function _loadPostalLocations(context, NS_MODULES, stateIndex) {
    console.log('fetching NCL locations');

    if (context.rootGetters['states'].findIndex(item => item.value === stateIndex) < 0) {
        console.error('state index ' + stateIndex + ' is invalid');
        return;
    }

    let NCLSearch = NS_MODULES.search.load({
        type: 'customrecord_ap_lodgment_location',
        id: 'customsearch_smc_noncust_location'
    });

    //NCL Type: AusPost(1), Toll(2), StarTrack(7)
    NCLSearch.filters.push(NS_MODULES.search.createFilter({
        name: 'custrecord_noncust_location_type',
        operator: NS_MODULES.search.Operator.ANYOF,
        values: [1, 2, 7]
    }))

    NCLSearch.filters.push(NS_MODULES.search.createFilter({
        name: 'custrecord_ap_lodgement_site_state',
        operator: NS_MODULES.search.Operator.IS,
        values: stateIndex, // NSW
    }))

    let results = NCLSearch.run();

    context.state.postalLocations.splice(0);
    let temp = 0;
    while (temp < 5) {
        let subset = results.getRange({start: temp * 1000, end: temp * 1000 + 1000});
        for (let postalLocation of subset) { // we can also use getAllValues() on one of these to see all available fields
            let entry = {};
            for (let fieldId in context.state.postalLocationForm) {
                if (['custrecord_noncust_location_type', 'custrecord_ap_lodgement_site_state'].includes(fieldId)) {
                    entry[fieldId] = postalLocation.getText({name: fieldId});
                } else entry[fieldId] = postalLocation.getValue({name: fieldId});
            }
            context.state.postalLocations.push(entry);
        }
        if (subset.length < 1000) break;
        temp++;
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

function _removeAddressFromNetSuite(NS_MODULES, customerId, addressInternalId) {
    let customerRecord = NS_MODULES.record.load({
        type: NS_MODULES.record.Type.CUSTOMER,
        id: customerId,
    });
    let line = customerRecord.findSublistLineWithValue({sublistId: 'addressbook', fieldId: 'internalid', value: addressInternalId});

    customerRecord.removeLine({sublistId: 'addressbook', line});

    customerRecord.save({ignoreMandatoryFields: true});
}

function _updateDefaultShippingAndBillingAddress(NS_MODULES, context, customerId, addressSublistForm) {
    let updateAddressLabel = (record) => { // this function is the same as _setAddressLabel() but apply directly on NS record
        if (record.getCurrentSublistValue({sublistId: 'addressbook', fieldId: 'defaultshipping'})) {
            record.setCurrentSublistValue({sublistId: 'addressbook', fieldId: 'label', value: 'Site Address'});
        } else if (record.getCurrentSublistValue({sublistId: 'addressbook', fieldId: 'defaultbilling'})) {
            record.setCurrentSublistValue({sublistId: 'addressbook', fieldId: 'label', value: 'Billing Address'});
        } else if (record.getCurrentSublistValue({sublistId: 'addressbook', fieldId: 'isresidential'})) {
            record.setCurrentSublistValue({sublistId: 'addressbook', fieldId: 'label', value: 'Postal Address'});
        } else {
            record.setCurrentSublistValue({sublistId: 'addressbook', fieldId: 'label', value: 'Other Address'});
        }
    }
    if (addressSublistForm.defaultshipping && context.state.shippingAddressAdded !== addressSublistForm.internalid && context.state.shippingAddressAdded !== null) {
        let customerRecord = NS_MODULES.record.load({
            type: NS_MODULES.record.Type.CUSTOMER,
            id: customerId,
            isDynamic: true
        });
        let line = customerRecord.findSublistLineWithValue({sublistId: 'addressbook', fieldId: 'internalid', value: context.state.shippingAddressAdded});
        customerRecord.selectLine({sublistId: 'addressbook', line});
        customerRecord.setCurrentSublistValue({sublistId: 'addressbook', fieldId: 'defaultshipping', value: false});

        updateAddressLabel(customerRecord);

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

        updateAddressLabel(customerRecord);

        customerRecord.commitLine({sublistId: 'addressbook'});
        customerRecord.save({ignoreMandatoryFields: true});
    }
}

function _checkBillingAndShippingAddress(context) {
    let shippingAddresses = context.state.addresses.filter(item => item.defaultshipping === true);
    context.state.shippingAddressAdded = shippingAddresses.length ? shippingAddresses[0].internalid : null;

    let billingAddresses = context.state.addresses.filter(item => item.defaultbilling === true);
    context.state.billingAddressAdded = billingAddresses.length ? billingAddresses[0].internalid : null;
}

function _setAddressLabel(addressObject) {
    if (addressObject.defaultshipping) {
        addressObject.label = 'Site Address';
    } else if (addressObject.defaultbilling) {
        addressObject.label = 'Billing Address';
    } else if (addressObject.isresidential) {
        addressObject.label = 'Postal Address';
    } else {
        addressObject.label = 'Other Address';
    }
}


export default {
    state,
    getters,
    actions,
    mutations
};