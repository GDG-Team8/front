import qs from 'qs';
import {useEffect} from 'react';
import {useDispatch} from 'react-redux';
import {RouteComponentProps} from 'react-router-dom';
import request from '../../plugins/axios';
import {setUser} from '../../slices/user';

interface AccessToken {
  accessToken: string;
}

interface JWT {
  accessToken: string;
  member: string;
}

interface GitHubResponse {
  id: number;
  email: string;
}

const CallbackPage = ({history, location}: RouteComponentProps) => {
  const dispatch = useDispatch();

  useEffect(() => {
    async function getToken() {
      const {code} = qs.parse(location.search, {
        ignoreQueryPrefix: true,
      });

      try {
        const {
          data: {accessToken},
        } = await request.get<AccessToken>(
          `/githubAccessToken?authorizationCode=${code}`,
        );

        /**
         * 1. GitHub Api call to get user data
         * 2. Post to our api for saving user data
         * 3. history push
         */

        const {data} = await request.get<GitHubResponse>(
          'https://api.github.com/user',
          {
            headers: {
              Authorization: `token ${accessToken}`,
            },
          },
        );

        dispatch(setUser({github_id: data.id, email: data.email})); // Update UserStore

        const res = await request.get<JWT>(`/signin/${data.id}`);

        if (res.data.member === 'false') {
          history.push('/signup');
        } else if (res.data.accessToken.length > 0) {
          sessionStorage.setItem('accessToken', res.data.accessToken);
          history.push('/');
        }
      } catch (error) {
        history.push('/error');
      }
    }

    getToken();
  }, [location, history, dispatch]);

  return null;
};

export default CallbackPage;
