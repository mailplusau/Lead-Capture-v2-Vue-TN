import getNSModules from '../../utils/ns-modules';

const state = {
    serviceRecord: {
        internalid: null, // Service Record's Internal ID
        custrecord_service: null, // Service Type ID
        name: '', // Service Type Name
        custrecord_service_price: '0.00', // Service Price
        custrecord_service_description: '', // Service Description
        custrecord_service_customer: null, // Customer's Internal ID

        custrecord_service_comm_reg: null, // Service Commencement Registration ID
        custrecord_service_date_reviewed: '', // Date Reviewed (D/M/YYYY)

        toBeDeleted: false, // This doesn't exist in NS, we just have this here for mass update
    },
    assignedServices: {
        form: [
            // {name: 'test 1', custrecord_service_description: 'description 1', custrecord_service_price: '11.44', toBeDeleted: null},
            // {name: 'test 2', custrecord_service_description: 'description 2', custrecord_service_price: '222.69', toBeDeleted: null},
        ],
        data: [],
        disabled: true,
        busy: true,
    },
    serviceTypes: [],

    commencementRegistrationId: null,
};

const getters = {
    assignedServices : state => state.assignedServices.form,
    assignedServicesDisabled : state => state.assignedServices.disabled,
    assignedServicesBusy : state => state.assignedServices.busy,
    serviceTypes : state => state.serviceTypes,
};

const mutations = {
    resetAssignedServicesForm : state => { state.assignedServices.form = [...state.assignedServices.data]; },
    disableAssignedServicesForm : (state, disabled = true) => { state.assignedServices.disabled = disabled; },
    addNewAssignedService : state => {
        let tmp = {...state.serviceRecord};

        state.assignedServices.form.push(tmp);
    },
    deleteAnAssignedService : (state, arrayIndex) => { state.assignedServices.form[arrayIndex].toBeDeleted = true; },
    restoreAnAssignedService : (state, arrayIndex) => { state.assignedServices.form[arrayIndex].toBeDeleted = false; },
};

const actions = {
    init : context => {
        if (!context.rootGetters['customer/internalId']) return;

        context.state.serviceRecord.custrecord_service_customer = context.rootGetters['customer/internalId'];

        context.dispatch('getServiceTypes').then();
        context.dispatch('getAssignedServices').then();
    },
    getServiceTypes : async context => {
        let { search } = await getNSModules();

        let serviceTypeSearch = search.create({
            type: 'customrecord_service_type',
            columns: [
                {name: 'internalid'},
                {name: 'custrecord_service_type_ns_item_array'},
                {name: 'name'}
            ]
        });
        serviceTypeSearch.filters.push(search.createFilter({
            name: 'custrecord_service_type_category',
            operator: search.Operator.ANYOF,
            values: [1] // NO IDEA WHAT THIS IS
        }));

        let searchResult = serviceTypeSearch.run();

        searchResult.each(item => {
            context.state.serviceTypes.push({
                value: item.getValue('internalid'),
                text: item.getValue('name')
            })

            return true;
        })

    },
    getAssignedServices : async context => {
        let { search } = await getNSModules();

        let serviceSearch = search.load({
            id: 'customsearch_salesp_services',
            type: 'customrecord_service'
        });

        serviceSearch.filters.push(search.createFilter({
            name: 'custrecord_service_customer',
            operator: search.Operator.ANYOF,    
            values: context.rootGetters['customer/internalId']
        }));

        let resultSetServices = serviceSearch.run();

        context.state.assignedServices.data.splice(0);

        resultSetServices.each(function (item) {
            let tmp = {};

            for (let fieldId in context.state.serviceRecord)
                tmp[fieldId] = item.getValue(fieldId);

            context.state.assignedServices.data.push(tmp);

            return true;
        });

        context.commit('resetAssignedServicesForm');

        context.state.assignedServices.busy = false;
    },
    getCommenceRegistrationId : async context => {
        let { search } = await getNSModules();

        let commRegSearch = search.load({
            id: 'customsearch_service_commreg_assign',
            type: 'customrecord_commencement_register'
        });

        commRegSearch.filters.push(
            search.createFilter({
                name: 'custrecord_customer',
                operator: search.Operator.ANYOF,
                values: context.rootGetters['customer/internalId']
            })
        );
        commRegSearch.filters.push(
            search.createFilter({
                name: 'custrecord_franchisee',
                operator: search.Operator.IS,
                values: context.rootGetters['customer/details'].partner
            })
        );

        commRegSearch.run().each(item => { // Taking only the first one hence returning false
            console.log('commReg ', item.getValue('internalid'));
            context.state.serviceRecord.custrecord_service_comm_reg = item.getValue('internalid');
            return false;
        })
    },

    saveAssignedServices : async context => { // Reference scripts: 628, 629
        console.log(context.state);
        context.commit('disableAssignedServicesForm');
        _displayBusyGlobalModal(context);

        setTimeout(async () => {
            let NS_MODULES = await getNSModules();

            for (let service of context.state.assignedServices.form) {
                if (service.internalid) { // This service record has internal id, we update or delete it
                    let originalIndex = context.state.assignedServices.data.findIndex(item => item.internalid === service.internalid);

                    let serviceRecord = NS_MODULES.record.load({
                        type: 'customrecord_service',
                        id: service.internalid,
                        isDynamic: true
                    });

                    if (service.toBeDeleted) { // We delete the service marked for deletion
                        // TODO: delete service
                        console.log('Service to be deleted:', service.internalid)
                    } else if (originalIndex >= 0) { // We check if the service needs to be updated
                        // TODO: handle different commencement registration ids
                        let originalService = context.state.assignedServices.data[originalIndex];

                        if (parseInt(originalService.custrecord_service) !== parseInt(service.custrecord_service) ||
                            parseFloat(originalService.custrecord_service_price) !== parseFloat(service.custrecord_service_price) ||
                            originalService.custrecord_service_description || service.custrecord_service_description) {
                            // Save existing service

                            _saveServiceRecord(context, serviceRecord, service);
                        }
                    }
                } else if (!service.toBeDeleted) { // Save a new service
                    let serviceRecord = NS_MODULES.record.create({
                        type: 'customrecord_service',
                        isDynamic: true
                    });

                    _saveServiceRecord(context, serviceRecord, service);
                }
            }
        }, 150);
    }
};

function _saveServiceRecord(context, serviceRecord, serviceData) {
    serviceData['name'] = _getServiceTypeNameFromServiceTypeId(context, serviceData['custrecord_service']);

    for (let fieldId in context.state.serviceRecord)
        serviceRecord.setValue({fieldId, value: serviceData[fieldId]});

    serviceRecord.save({ignoreMandatoryFields: true});
}

function _displayBusyGlobalModal(context, open = true) {
    context.rootState.globalModal.title = 'Customer #' + context.rootGetters['customer/internalId'];
    context.rootState.globalModal.body = 'Saving Assigned Services. Please Wait...';
    context.rootState.globalModal.busy = open;
    context.rootState.globalModal.open = open;
}

function _getServiceTypeNameFromServiceTypeId(context, serviceTypeId) {
    let index = context.serviceTypes.findIndex(item => parseInt(item.value) === parseInt(serviceTypeId));

    return index >= 0 ? context.serviceTypes[index].text : null;
}

export default {
    state,
    getters,
    actions,
    mutations
};