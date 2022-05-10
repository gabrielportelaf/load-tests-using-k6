import http from 'k6/http';
import { Trend, Rate, Counter, Gauge } from 'k6/metrics';
import {check, group, sleep} from 'k6';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

export function handleSummary(data) {
    return {
      "report.html": htmlReport(data),
    };
  }

export const TrendRTT = new Trend('RTT');
export const GaugeContentSize = new Gauge('ContentSize');
export const CounterErrors = new Counter('Errors');
export const options = {
  thresholds: {
    http_req_failed:  ['rate<0.01'], // errors should be less than 1%
    'Errors': ['count<100'],
    'ContentSize': ['value<4000'], // content is smaller than 4000 bytes.
    'RTT': ['p(99)<300', 'p(70)<250', 'avg<200', 'med<150', 'min<100'], 
  },
};

//VARIABLES

const domain = 'http://localhost:3000';

//VALIDATIONS

export default function() {
    group('Login na API de Auth', () => {
        
        const payload = JSON.stringify({
            email: 'email@dominio.com',
            password: 'password'
        });

        const params = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const requestApiToken = http.post(domain + '/auth/login', payload, params);

        check(requestApiToken, {
            'is status 200': (r) => r.status === 200,
        });
        
        const response = JSON.parse(requestApiToken.body)
        global.apiAccessToken = response.access_token

        TrendRTT.add(requestApiToken.timings.duration);
        GaugeContentSize.add(requestApiToken.body.length);        
    })

    group('GET /users', () => {
        
        const params = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${global.apiAccessToken}`,
            },
        };

        const getUsersRequest = http.get(domain + '/users', params);

        check(getUsersRequest, {
            'is status 200': (r) => r.status === 200,
        });
        
        TrendRTT.add(getUsersRequest.timings.duration);
        GaugeContentSize.add(getUsersRequest.body.length);
    })
  
    group('POST /user', () => {
        
        const payload = JSON.stringify({
            "name":  "User 1",
            "email": "user1@dominio.com",
            "password": "password"
        });
          
        const params = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${global.apiAccessToken}`,
            },
        };

        const postUsersRequest = http.post(domain + '/users', payload, params);

        check(postUsersRequest, {
            'is status 201': (r) => r.status === 201,
        });
        const response = JSON.parse(postUsersRequest.body)
        global.userId = response.id

        TrendRTT.add(postUsersRequest.timings.duration);
        GaugeContentSize.add(postUsersRequest.body.length);

        console.log("userId" + `${global.userId}`);
    })

    group('PUT /user', () => {
        
        const payload = JSON.stringify({
            "name": "User 2",
            "email": "user2@dominio.com",
            "password": "password"
        });
          
        const params = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${global.apiAccessToken}`,
            },
        };

        const putUsersRequest = http.put(domain + '/users/' + `${global.userId}`, payload, params);

        check(putUsersRequest, {
            'is status 200': (r) => r.status === 200,
        });
        const response = JSON.parse(putUsersRequest.body)
        //global.userId = response.id

        TrendRTT.add(putUsersRequest.timings.duration);
        GaugeContentSize.add(putUsersRequest.body.length);
    })
}

