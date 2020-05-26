import React, { useReducer, useEffect } from 'react';
import { withAuthenticator } from 'aws-amplify-react';
import { API, graphqlOperation, Auth } from 'aws-amplify';
import uuid from 'uuid/dist/esm-browser/v4'

import { listTalks as ListTalks } from './graphql/queries';
import { createTalk as CreateTalk } from './graphql/mutations';
// subscriptions
import { onCreateTalk as OnCreateTalk } from './graphql/subscriptions';
import { onDeleteTalk as OnDeleteTalk } from './graphql/subscriptions';
// const ListTalks = `
// query ListTalks(
//   $filter: ModelTalkFilterInput
//   $limit: Int
//   $nextToken: String
// ) {
//   listTalks(filter: $filter, limit: $limit, nextToken: $nextToken) {
//     items {
//       id
//       clientId
//       name
//       description
//       speakerName
//       speakerBio
//     }
//     nextToken
//   }
// }
// `;

const CLIENT_ID = uuid();

// create initial state
const initialState = {
  name: '', description: '', speakerName: '', speakerBio: '', talks: []
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_TALKS':
      return { ...state, talks: action.talks }
    case 'SET_INPUT':
      return { ...state, [action.key]: action.value }
    case 'CLEAR_INPUT':
      return { ...initialState, talks: state.talks }
    case 'ADD_TALK':
      return { ...state, talks: [...state.talks, action.talk] }
    default:
      return state
  }
}

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    Auth.currentAuthenticatedUser()
      .then(user => console.info(`%c username ${user.username}`, 'color: green;', user))
      .catch(err => console.error(`%c error info ${err}`, 'color: red;'))
    const subscription = API.graphql(graphqlOperation(OnCreateTalk)).subscribe({
      next: (eventData) => {
        const talk = eventData.value.data.onCreateTalk;
        console.info("Z subscripcji...", talk)
        if (talk.clientId === CLIENT_ID) return;
        dispatch({ type: 'ADD_TALK', talk })
      }
    })

    const subscriptionOnDelete = API.graphql(graphqlOperation(OnDeleteTalk)).subscribe({
      next: (eventData) => {
        getData();
      }
    })

    getData();
    return () => {
      subscription.unsubscribe();
      subscriptionOnDelete.unsubscribe();
    }
  }, []);

  async function getData() {
    try {
      const talkData = await API.graphql(graphqlOperation(ListTalks));
      dispatch({ type: 'SET_TALKS', talks: talkData.data.listTalks.items });
    } catch (error) {
      console.error('error fetching talks...', error);
    }
  }

  async function createTalk() {
    const { name, description, speakerBio, speakerName } = state;
    if (name === '' || description === '' ||
      speakerBio === '' || speakerName === '') return
    const talk = { name, description, speakerBio, speakerName, clientId: CLIENT_ID }
    const talks = [...state.talks, talk]
    dispatch({ type: 'SET_TALKS', talks })
    dispatch({ type: 'CLEAR_INPUT' })

    try {
      await API.graphql(graphqlOperation(CreateTalk, { input: talk }));
      console.info('%c item created!', 'color:blue;')
    } catch (error) {
      console.error('%c Error creating talk...', 'color:red;', error)
    }
  }

  const onChange = (e) => {
    dispatch({ type: 'SET_INPUT', key: e.target.name, value: e.target.value })
  }

  return (
    <div>
      <input
        name='name'
        onChange={onChange}
        value={state.name}
        placeholder='name'
      />
      <input
        name='description'
        onChange={onChange}
        value={state.description}
        placeholder='description'
      />
      <input
        name='speakerName'
        onChange={onChange}
        value={state.speakerName}
        placeholder='speakerName'
      />
      <input
        name='speakerBio'
        onChange={onChange}
        value={state.speakerBio}
        placeholder='speakerBio'
      />
      <button onClick={createTalk}>Save new talk</button>

      <div>
        {
          state.talks.map((talk, index) => (
            <div key={index} >
              <h3>{talk.speakerName}</h3>
              <h5>{talk.name}</h5>
              <p>{talk.description}</p>
            </div>
          ))
        }
      </div>
    </div >
  );
}
export default withAuthenticator(App, { includeGreetings: true });