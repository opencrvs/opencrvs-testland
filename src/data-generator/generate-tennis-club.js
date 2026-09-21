const firstNames = [
  'James',
  'Mary',
  'John',
  'Patricia',
  'Robert',
  'Jennifer',
  'Michael',
  'Linda',
  'William',
  'Elizabeth',
  'David',
  'Barbara',
  'Richard',
  'Susan',
  'Joseph',
  'Jessica',
  'Thomas',
  'Sarah',
  'Charles',
  'Karen',
  'Christopher',
  'Nancy',
  'Daniel',
  'Lisa',
  'Matthew',
  'Betty',
  'Anthony',
  'Margaret',
  'Mark',
  'Sandra',
  'Donald',
  'Ashley',
  'Steven',
  'Kimberly',
  'Paul',
  'Emily',
  'Andrew',
  'Donna',
  'Joshua',
  'Michelle',
  'Kenneth',
  'Dorothy',
  'Kevin',
  'Carol',
  'Brian',
  'Amanda',
  'George',
  'Melissa',
  'Edward',
  'Deborah',
  'Ronald',
  'Stephanie',
  'Timothy',
  'Rebecca',
  'Jason',
  'Sharon',
  'Jeffrey',
  'Laura',
  'Ryan',
  'Cynthia',
  'Jacob',
  'Kathleen',
  'Gary',
  'Amy',
  'Nicholas',
  'Shirley',
  'Eric',
  'Angela',
  'Stephen',
  'Helen',
  'Jonathan',
  'Anna',
  'Larry',
  'Brenda',
  'Justin',
  'Pamela',
  'Scott',
  'Nicole',
  'Brandon',
  'Emma',
  'Benjamin',
  'Samantha',
  'Samuel',
  'Katherine',
  'Gregory',
  'Christine',
  'Frank',
  'Debra',
  'Alexander',
  'Rachel',
  'Raymond',
  'Catherine',
  'Patrick',
  'Carolyn',
  'Jack',
  'Janet',
  'Dennis',
  'Ruth',
  'Jerry',
  'Maria'
]
const surnames = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Garcia',
  'Miller',
  'Davis',
  'Rodriguez',
  'Martinez',
  'Hernandez',
  'Lopez',
  'Gonzalez',
  'Wilson',
  'Anderson',
  'Thomas',
  'Taylor',
  'Moore',
  'Jackson',
  'Martin',
  'Lee',
  'Perez',
  'Thompson',
  'White',
  'Harris',
  'Sanchez',
  'Clark',
  'Ramirez',
  'Lewis',
  'Robinson',
  'Walker',
  'Young',
  'Allen',
  'King',
  'Wright',
  'Scott',
  'Torres',
  'Nguyen',
  'Hill',
  'Flores',
  'Green',
  'Adams',
  'Nelson',
  'Baker',
  'Hall',
  'Rivera',
  'Campbell',
  'Mitchell',
  'Carter',
  'Roberts',
  'Gomez',
  'Phillips',
  'Evans',
  'Turner',
  'Diaz',
  'Parker',
  'Cruz',
  'Edwards',
  'Collins',
  'Reyes',
  'Stewart',
  'Morris',
  'Morales',
  'Murphy',
  'Cook',
  'Rogers',
  'Gutierrez',
  'Ortiz',
  'Morgan',
  'Cooper',
  'Peterson',
  'Bailey',
  'Reed',
  'Kelly',
  'Howard',
  'Ramos',
  'Kim',
  'Cox',
  'Ward',
  'Richardson',
  'Watson',
  'Brooks',
  'Chavez',
  'Wood',
  'James',
  'Bennett',
  'Gray',
  'Mendoza',
  'Ruiz',
  'Hughes',
  'Price',
  'Alvarez',
  'Castillo',
  'Sanders',
  'Patel',
  'Myers',
  'Long',
  'Ross',
  'Foster',
  'Jimenez'
]

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const AUTH_URL = 'https://auth.farajaland-dev.opencrvs.dev'
const CLIENT_URL = 'https://register.farajaland-dev.opencrvs.dev'

const authUrl = `${AUTH_URL}/authenticate`
const verifyUrl = `${AUTH_URL}/verifyCode`

const authResponse = await fetch(authUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'k.mweene',
    password: 'test'
  })
})

const authBody = await authResponse.json()
const verifyResponse = await fetch(verifyUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    nonce: authBody.nonce,
    code: '000000'
  })
})

const verifyResponseJson = await verifyResponse.json()
const { token } = verifyResponseJson

// console.log({ verifyResponseJson });

const headers = {
  accept: '*/* ',
  'accept-language': 'en-US,en;q=0.9',
  authorization: `Bearer ${token}`,
  'content-type': 'application/json',
  'sec-ch-ua':
    '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Linux"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
  cookie:
    'metabase.DEVICE=090fd868-3495-497f-b4d5-eafd2bff0c0b; metabase.TIMEOUT=alive; metabase.SESSION=dd3a3919-c4a4-4bd4-afb4-34e781875185',
  Referer: `${CLIENT_URL}/workqueue/assigned-to-you`
}

for (let i = 0; i < 15; i++) {
  const createResponse = await fetch(
    `${CLIENT_URL}/api/events/event.create?batch=1`,
    {
      headers,
      body: JSON.stringify({
        0: {
          json: {
            type: 'tennis-club-membership',
            transactionId: `tmp-${generateUUID()}`,
            declaration: null
          }
        }
      }),
      method: 'POST'
    }
  )

  const createResponseJson = await createResponse.json()

  // console.log(JSON.stringify(createResponseJson, null, 2));

  const eventId = createResponseJson[0].result.data.json.id

  const transactionId = generateUUID()

  const applicantName = {
    firstname: firstNames[Math.floor(Math.random() * firstNames.length)],
    surname: surnames[Math.floor(Math.random() * surnames.length)]
  }
  console.log(
    `${i + 1}: ${eventId} => ${applicantName.firstname} ${applicantName.surname}`
  )

  // console.log({ applicantName, eventId, transactionId });

  const declareResponse = await fetch(
    `${CLIENT_URL}/api/events/event.actions.declare.request?batch=1`,
    {
      headers,
      body: JSON.stringify({
        0: {
          json: {
            declaration: {
              'recommender.none': true,
              'applicant.name': applicantName,
              'applicant.dob': '2026-02-23',
              'applicant.tob': '15:55'
            },
            annotation: {},
            eventId,
            transactionId,
            keepAssignment: true
          }
        }
      }),
      method: 'POST'
    }
  )

  const declareResponseJson = await declareResponse.json()
  //   console.log(JSON.stringify(declareResponseJson, null, 2));

  const validateResponse = await fetch(
    `${CLIENT_URL}/api/events/event.actions.validate.request?batch=1`,
    {
      headers,
      body: JSON.stringify({
        0: {
          json: {
            declaration: {},
            annotation: {},
            eventId,
            transactionId,
            keepAssignment: true
          }
        }
      }),
      method: 'POST'
    }
  )
  const validateResponseJson = await validateResponse.json()
  // console.log(JSON.stringify(validateResponseJson, null, 2));

  const registerResponse = await fetch(
    `${CLIENT_URL}/api/events/event.actions.register.request?batch=1`,
    {
      headers,
      referrer: `${CLIENT_URL}/workqueue/assigned-to-you`,
      body: JSON.stringify({
        0: {
          json: {
            declaration: {},
            annotation: {},
            eventId,
            transactionId
          }
        }
      }),
      method: 'POST',
      mode: 'cors',
      credentials: 'include'
    }
  )
  const registerResponseJson = await registerResponse.json()
  // console.log(JSON.stringify(registerResponseJson, null, 2));
}
