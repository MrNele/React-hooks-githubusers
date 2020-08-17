import React, { useState, useEffect } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";

const rootUrl = "https://api.github.com";
const GithubContext = React.createContext();
// pristup dvema komponentama:
// 1) Provider
// 2) Consumer
//  Pristup: GithubContext.Provider

const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser);
  const [repos, setRepos] = useState(mockRepos);
  const [followers, setFollowers] = useState(mockFollowers);
  // zahtev loading
  const [requests, setRequests] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  //error
  const [error, setError] = useState({ show: false, msg: "" });

  const searchGithubUser = async (user) => {
    toggleError();
    setIsLoading(true);
    // console.log(user);
    const response = await axios(`${rootUrl}/users/${user}`).catch((err) =>
      console.log(err)
    );
    // console.log(response);

    if (response) {
      setGithubUser(response.data);
      const {login, followers_url}=response.data;

      await Promise.allSettled([
      axios(`${rootUrl}/users/${login}/repos?per_page=100`),
      axios(`${followers_url}?per_page=100`),
    ]).then((results)=>{
        const [repos, followers]=results;
        const status='fulfilled';
        if(repos.status===status){
          setRepos(repos.value.data);
        }
        if(followers.status===status){
          setFollowers(followers.value.data);
        }
      }).catch(err=>console.log(err));
    } else {
      toggleError(true, "there is no user with that username");
    }
    checkRequests();
    setIsLoading(false);
  };

  // check rate
  const checkRequests = () => {
    axios(`${rootUrl}/rate_limit`)
      .then(({ data }) => {
        let {
          rate: { remaining },
        } = data;
        remaining = 0;
        setRequests(remaining);
        if (remaining === 0) {
          toggleError(true, "sorry, you have exceeded your hourly rate limit!");
        }
      })
      .catch((err) => console.log(err));
  };
  function toggleError(show = false, msg = "") {
    setError({ show, msg });
  }
  // error
  useEffect(checkRequests, []);
  // console.log('hey app loadeed');

  return (
    <GithubContext.Provider
      value={{
        githubUser,
        repos,
        followers,
        requests,
        error,
        searchGithubUser,
        isLoading
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};

export { GithubProvider, GithubContext };
