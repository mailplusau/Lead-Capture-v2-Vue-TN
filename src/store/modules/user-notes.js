import getNSModules from '../../utils/ns-modules';
import axios from "axios";

const state = {
    // data: [ { "note_date": "1/1/2008 2:18 PM", "author": "-System-", "message": "02/07/2009 - JoMcLau - Price Increase" }, { "note_date": "1/2/2013 4:08 PM", "author": "Adele Fepuleai", "message": "Dec paid 25/1 by EFT" }, { "note_date": "24/4/2015 9:59 AM", "author": "Alice Monis", "message": "Inbound call from Christine advise \r\nmaid payment last 22/04" }, { "note_date": "1/7/2019 11:16 AM", "author": "Amy Javed", "message": "Kristy called and disputed on INV724559 as it is incorrect, emailed zee. Confirmed!\r\nINV724559 will be credited, emailed Mika!" }, { "note_date": "9/7/2019 2:23 PM", "author": "Amy Javed", "message": "INV726195 will be credited. Emailed Mika" }, { "note_date": "22/5/2019 2:07 PM", "author": "Jori Jori", "message": "INV708553 dispute - Kristy Davey, emailed zee- confirmed, sent to Popie" }, { "note_date": "22/1/2019 3:27 PM", "author": "Levi Arrogante", "message": "Hi Kristy,\r\n\r\n\r\nI rang your office but you were not available.\r\n\r\nI am chasing the following outstanding invoice that requires payment:\r\n\r\nINV666832\r\n\r\nKindly advise when payment can be arranged. Thank you.\r\n\r\n\r\nKind regards,\r\n\r\n\r\n\r\nLevi Arrogante" }, { "note_date": "20/7/2015 3:42 PM", "author": "Nina Waterworth", "message": "resent invoice" }, { "note_date": "21/5/2018 9:39 AM", "author": "Paul O'Brien", "message": "LM" }, { "note_date": "21/11/2017 10:47 AM", "author": "Paul O'Brien", "message": "Sent Oct to AP as it had not been received and updated invoicing method" }, { "note_date": "21/5/2018 9:49 AM", "author": "Paul O'Brien", "message": "Inbound call from AP, resent missing March, April paid on Friday" }, { "note_date": "26/4/2018 4:52 PM", "author": "Paul O'Brien", "message": "CB tomorrow" }, { "note_date": "17/10/2017 4:58 PM", "author": "Paul O'Brien", "message": "Sent Sept to AP for status check" }, { "note_date": "28/11/2016 4:20 PM", "author": "Popie Han_OLD", "message": "INV461054 will be paid this week" }, { "note_date": "17/7/2019 11:55 AM", "author": "Swapna Eadara", "message": "LM for May inv; emailed May inv" }, { "note_date": "16/10/2020 12:51 PM", "author": "Turkan Koc", "message": "AP paid Sep inv Today." }, { "note_date": "3/9/2021 12:40 PM", "author": "Yassine El Moukadam", "message": "sent fu" }, { "note_date": "6/9/2021 10:52 AM", "author": "Yassine El Moukadam", "message": "INV926539 voided\r\nDuplicate August invoice\r\nRicky Zammit <ricandlea@bigpond.com>\r\nFri 03-Sep-21 8:42 PM\r\nHi Yassine,\r\n\r\nLooks like a duplicate to me as well. Credit it. No idea how it happened, I only did it once.\r\n\r\nThanks Rick Zammit \r\n\r\nSent from my iPad" }, { "note_date": "1/9/2021 4:29 PM", "author": "Yassine El Moukadam", "message": "Dili, july query, emailed zee" } ],
    data: [],
    busy: false,
    userNote: {
        internalid: null,
        entity: null, // Customer ID that this belongs to
        direction: null,
        notetype: null,
        note: null, // Message in the note
        notedate: null, // Date Create
        author: null, // Author of this note
        title: 'User Note', // Note's title
    },
    newNoteModal: {
        open: false,
        busy: false,
        form: {},
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
};

const getters = {
    get : state => state.data,
    busy : state => state.busy,
    newNoteModal : state => state.newNoteModal,
    directionOptions : state => state.directionOptions,
    noteTypeOptions : state => state.noteTypeOptions,
};

const mutations = {
    resetNewNoteForm : state => { state.newNoteModal.form = {...state.userNote} },
};

const actions = {
    init : context => {
        if (!context.rootGetters['customer/internalId']) return;

        context.dispatch('getUserNotes').then();
        context.commit('resetNewNoteForm');
    },
    getUserNotes : async context => {
        console.log('fetching user notes...')

        let {data, error} = await axios.get(window.location.href, {
            params: {
                requestData: JSON.stringify({
                    operation: 'userNotesSearch',
                    data: {
                        customerId: context.rootGetters['customer/internalId']
                    }
                })
            }
        });

        if (error) console.error(error)
        else if (data) context.state.data = [...data]
    },
    createNewUserNote : async context => {
        if (!context.rootGetters['customer/internalId']) return;

        context.state.newNoteModal.busy = true;

        setTimeout(async () => {
            try {
                let {record, runtime} = await getNSModules();

                let userNoteRecord = record.create({
                    type: record.Type['NOTE'],
                });

                context.state.newNoteModal.form.entity = context.rootGetters['customer/internalId'];
                context.state.newNoteModal.form.author = runtime.getCurrentUser().id;
                context.state.newNoteModal.form.notedate = new Date();

                for (let fieldId in context.state.userNote)
                    userNoteRecord.setValue({fieldId, value: context.state.newNoteModal.form[fieldId]});

                userNoteRecord.save({ignoreMandatoryFields: true});

                context.commit('resetNewNoteForm');

                context.dispatch('getUserNotes').then();
            } catch (e) {
                console.log(e);
                context.commit('displayErrorGlobalModal', {title: 'Error Creating New Note', message: e.cause || e}, {root: true})
            }

            context.state.newNoteModal.busy = false;
            context.state.newNoteModal.open = false;
        }, 150);
    }
};

export default {
    state,
    getters,
    actions,
    mutations
};