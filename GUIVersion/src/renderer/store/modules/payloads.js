const state = {
  payloads : [{
    id : 0,
    payload : 'function feedback_fuckxss_payload(data){ window.fuckxss.socket.send(data); }'
  }],
  ids : 1
}

const mutations = {
  UPDATE_PATLOAD (state, info) {
    for(const i of state.payloads){
      if(i.id === info['id']){
        i.payload = info['payload'];
        break;
      }
    }
  },
  CREATE_PAYLOAD (state, info) {
    state.payloads.push({
      id : state.ids++,
      payload : info['payload']
    });
  },
  DELETE_PAYLOAD (state, info) {
    for(const i in state.payloads){
      if(state.payloads[i].id === info['id']){
        state.payloads.splice(i, 1);
      }
    }
  }
}

const getters = {
  getPayloads(state){
    return state.payloads;
  }
}

export default {
  state,
  getters,
  mutations,
}