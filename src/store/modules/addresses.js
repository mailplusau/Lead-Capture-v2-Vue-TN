import http from "@/utils/http";
import {setObjectInArray, setObjectValueInArray, VARS} from '@/utils/utils.mjs';

let localId = 1;
const oldAddressLabel = 'Old Address';

const state = {
    idToDelete: null,
    addresses: {
        data: [],
        busy: false,
    },
    dialog: {
        title: '',
        form: {},
        busy: false,
        open: false,
    },
    address: {...VARS.addressFields, isOldAddress: false,},
    addressSublist: {...VARS.addressSublistFields},
    postalState: 0,
    postalLocations: {
        data: [],
        busy: false,
    },
    addressTypes: {
        selected: 'street',
        options: [
            {value: 'street', text: 'Street Address'},
            {value: 'postal', text: 'Postal Address'},
        ]
    }
};

const getters = {
    all : state => state.addresses,
    dialog : state => state.dialog,
    postalState : state => state.postalState,
    postalLocations : state => state.postalLocations,
    addressTypes : state => state.addressTypes,
    idToDelete : state => state.idToDelete,

    currentShippingAddress : state => {
        let index = state.addresses.data.findIndex(item => item.defaultshipping);
        return index >= 0 ? state.addresses.data[index].internalid : null;
    },
    currentBillingAddress : state => {
        let index = state.addresses.data.findIndex(item => item.defaultbilling);
        return index >= 0 ? state.addresses.data[index].internalid : null;
    }
};

const mutations = {
    setDialog : (state, open = true) => { state.dialog.open = open; },
    setPostalState : (state, stateIndex) => { state.postalState = stateIndex; },
    setIdToDelete : (state, id = null) => { state.idToDelete = id; },
    resetDialogForm : (state, companyName = '') => {
        state.dialog.form = {...state.address, ...state.addressSublist, addressee: companyName};
    }
};

const actions = {
    init : async context => {
        if (!context.rootGetters['customer/id'])
            return await context.dispatch('restoreStateFromLocalStorage');

        await _fetchAddresses(context);
    },
    openDialog : (context, {open = true, addressId = null}) => {
        context.state.dialog.open = open;

        if (open) {
            let index = context.state.addresses.data.findIndex(item => item.internalid === addressId);
            context.state.dialog.busy = true;
            context.state.dialog.title = index >= 0 ? `Edit Contact Id #${addressId}` : 'Add Address';

            if (index >= 0) { // Index exists, edit mode
                context.state.dialog.form = {...context.state.addresses.data[index]};

                if (context.state.addresses.data[index].custrecord_address_ncl) { // This is postal address, we need to load postal locations
                    context.state.addressTypes.selected = 'postal';
                    let stateIndex = context.rootGetters['misc/states'].findIndex(item => item.text === context.state.addresses.data[index].state);
                    context.state.postalState = stateIndex >= 0 ? context.rootGetters['misc/states'][stateIndex].value : 0;
                    context.dispatch('getPostalLocationsByStateId', context.state.postalState).then();
                } else context.state.addressTypes.selected = 'street';

            } else
                context.commit('resetDialogForm', context.rootGetters['customer/form'].data.companyname)

            context.state.dialog.busy = false;
        }
    },
    handleAddressTypeChanged : context => {
        // reset the form but preserve internal id (if any) to prevent a new address from being created in case of edit mode
        let index = context.state.addresses.data.findIndex(item => item.internalid === context.state.dialog.form.internalid);
        context.commit('resetDialogForm', context.rootGetters['customer/form'].data.companyname);

        // Check and preserve internal id (if any)
        if (index >= 0) state.dialog.form.internalid = state.addresses.data[index].internalid;
    },
    getPostalLocationsByStateId : async (context, postalStateId) => {
        context.state.postalLocations.busy = true;

        if (context.rootGetters['misc/states'].findIndex(item => item.value === postalStateId) >= 0) {
            let data = await http.get('getPostalLocationOptions', { postalStateId });

            context.state.postalLocations.data = Array.isArray(data) ? [...data] : [];
        } else console.error('state index ' + postalStateId + ' is invalid');
        
        context.state.postalLocations.busy = false;
    },
    handlePostalLocationChanged : (context) => {
        let index = context.state.postalLocations.data
            .findIndex(item => item.internalid === context.state.dialog.form.custrecord_address_ncl);

        if (index < 0) return;

        let postalLocation = context.state.postalLocations.data[index];
        context.state.dialog.form.state = postalLocation.custrecord_ap_lodgement_site_state;
        context.state.dialog.form.city = postalLocation.custrecord_ap_lodgement_suburb;
        context.state.dialog.form.zip = postalLocation.custrecord_ap_lodgement_postcode;
        context.state.dialog.form.custrecord_address_lat = postalLocation.custrecord_ap_lodgement_lat;
        context.state.dialog.form.custrecord_address_lon = postalLocation.custrecord_ap_lodgement_long;
    },
    saveAddress : async context => {
        context.commit('displayBusyGlobalModal', {title: 'Processing', message: 'Saving address. Please wait...'}, {root: true});

        // check if there's any default shipping. If not, set the current address in form as default shipping.
        // otherwise, check if the current address in form is set as default shipping, then un-default the previous default shipping.
        let currentShippingAddressIndex = context.state.addresses.data
            .findIndex(item => (item.defaultshipping && item.internalid !== context.state.dialog.form.internalid));

        if (currentShippingAddressIndex < 0)
            context.state.dialog.form.defaultshipping = true;  // check if there's any default shipping
        else if (context.state.dialog.form.defaultshipping && currentShippingAddressIndex >= 0) {
            setObjectValueInArray(context.state.addresses.data, currentShippingAddressIndex, 'defaultshipping', false);
            _setLocalAddressLabel(context.state.addresses.data[currentShippingAddressIndex]);
        }

        // check if there's any default billing. If not, set the current address in form as default billing.
        // otherwise, check if the current address in form is set as default billing, then un-default the previous default billing.
        let currentBillingAddressIndex = context.state.addresses.data
            .findIndex(item => (item.defaultbilling && item.internalid !== context.state.dialog.form.internalid));

        if (currentBillingAddressIndex < 0)
            context.state.dialog.form.defaultbilling = true;
        else if (context.state.dialog.form.defaultbilling && currentBillingAddressIndex >= 0) {
            setObjectValueInArray(context.state.addresses.data, currentBillingAddressIndex, 'defaultbilling', false);
            _setLocalAddressLabel(context.state.addresses.data[currentBillingAddressIndex]);
        }

        _setLocalAddressLabel(context.state.dialog.form);

        if (context.rootGetters['customer/id']) { // save addresses to NetSuite
            // eslint-disable-next-line no-unused-vars
            let {isOldAddress, ...addressData} = context.state.dialog.form;
            let addressArray = [{...addressData}];
            if (currentBillingAddressIndex >= 0) addressArray.push({...context.state.addresses.data[currentBillingAddressIndex]});
            if (currentShippingAddressIndex >= 0) addressArray.push({...context.state.addresses.data[currentShippingAddressIndex]});

            await http.post('saveAddress', {
                customerId: context.rootGetters['customer/id'],
                addressArray
            });

            await _fetchAddresses(context);
        } else { // or save it to local
            if (context.state.dialog.form.internalid !== null && context.state.dialog.form.internalid >= 0) {
                let currentIndex = context.state.addresses.data.findIndex(item => item.internalid === context.state.dialog.form.internalid);

                setObjectInArray(context.state.addresses.data, currentIndex, {...context.state.dialog.form});

            } else context.state.addresses.data.push({...context.state.dialog.form, internalid: localId++});

            await context.dispatch('saveStateToLocalStorage');
        }

        context.commit('resetDialogForm');

        context.commit('closeGlobalModal', null, {root: true});
    },
    removeAddress : async context => {
        let addressInternalId = context.state.idToDelete;
        
        if (!addressInternalId) return;

        context.state.idToDelete = null;
        
        context.commit('displayBusyGlobalModal', {title: 'Processing', message: 'Removing address. Please wait...'}, {root: true});

        if (context.rootGetters['customer/id']) {
            await http.post('deleteAddress', {
                customerId: context.rootGetters['customer/id'],
                addressInternalId
            });

            await _fetchAddresses(context);
        } else {
            let index = context.state.addresses.data.findIndex(item => item.internalid === addressInternalId);
            if (index >= 0) context.state.addresses.data.splice(index, 1);
        }

        await context.dispatch('saveStateToLocalStorage');

        context.commit('displayInfoGlobalModal', {title: 'Complete', message: 'Address has been deleted.'}, {root: true});
    },

    saveStateToLocalStorage : async context => {
        top.localStorage.setItem("1763_addresses", JSON.stringify(context.state.addresses.data));
    },
    clearStateFromLocalStorage : async () => {
        top.localStorage.removeItem("1763_addresses");
    },
    restoreStateFromLocalStorage : async context => {
        if (context.rootGetters['customer/id'] !== null) return;

        try {
            let data = JSON.parse(top.localStorage.getItem("1763_addresses"));
            if (Array.isArray(data)) context.state.addresses.data = [...data];
        } catch (e) {
            console.log('No stored data found')
        }
    }
};

mutations.resetDialogForm(state);

async function _fetchAddresses(context) {
    if (!context.rootGetters['customer/id']) return;

    context.state.addresses.busy = true;
    let data = await http.get('getCustomerAddresses', {
        customerId: context.rootGetters['customer/id']
    });

    context.state.addresses.data.splice(0);
    data.forEach(item => {
        context.state.addresses.data.push({
            ...item,
            isOldAddress: item.label === oldAddressLabel
        })
    })
    context.state.addresses.busy = false;
}

function _setLocalAddressLabel(addressObject) {
    if (addressObject.isOldAddress) {
        addressObject.label = oldAddressLabel;
    } else if (addressObject.defaultshipping) {
        addressObject.label = 'Site Address';
    } else if (addressObject.defaultbilling) {
        addressObject.label = 'Billing Address';
    } else if (addressObject.isresidential) {
        addressObject.label = 'Postal Address';
    } else {
        addressObject.label = 'Alternative Sender';
    }
}

export default {
    state,
    getters,
    actions,
    mutations
};