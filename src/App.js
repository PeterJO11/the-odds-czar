import React, { useState, useEffect } from "react";
import "./App.css";
import "@aws-amplify/ui-react/styles.css";
import {
  Button,
  Flex,
  Heading,
  Image,
  Text,
  TextField,
  View,
  withAuthenticator,
} from "@aws-amplify/ui-react";
import { listTeams } from "./graphql/queries";
import {
  createTeam as createTeamMutation,
  deleteTeam as deleteTeamMutation,
} from "./graphql/mutations";
import { Amplify, Storage } from "aws-amplify";
import { generateClient } from "aws-amplify/api";
import awsconfig from './aws-exports';

Amplify.configure(awsconfig);

const client = generateClient();

const App = ({ signOut }) => {
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    fetchTeams();
  }, []);

  async function fetchTeams() {
    const apiData = await client.graphql({ query: listTeams });
    const teamsFromAPI = apiData.data.listTeams.items;
    await Promise.all(
      teamsFromAPI.map(async (team) => {
        if (team.logoImage) {
          const url = await Storage.get(team.name);
          team.logoImage = url;
        }
        return team;
      })
    );
    setTeams(teamsFromAPI);
  }

  async function createTeam(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    const data = {
      name: form.get("name"),
      // description: form.get("description"),
    };
    await client.graphql({
      query: createTeamMutation,
      variables: { input: data },
    });
    fetchTeams();
    event.target.reset();
  }

  async function deleteTeam({ id }) {
    const newTeams = teams.filter((team) => team.id !== id);
    setTeams(newTeams);
    await client.graphql({
      query: deleteTeamMutation,
      variables: { input: { id } },
    });
  }

  return (
    <View className="App">
      <Heading level={1}>My Teams App</Heading>
      <View as="form" margin="3rem 0" onSubmit={createTeam}>
        <Flex direction="row" justifyContent="center">
          <TextField
            name="name"
            placeholder="Team Name"
            label="Team Name"
            labelHidden
            variation="quiet"
            required
          />
          {/* <TextField
            name="description"
            placeholder="Team Description"
            label="Team Description"
            labelHidden
            variation="quiet"
            required
          /> */}
          <Button type="submit" variation="primary">
            Create Team
          </Button>
        </Flex>
      </View>
      <Heading level={2}>Current Teams</Heading>
      <View margin="3rem 0">
        {teams.map((team) => (
          <Flex
            key={team.id || team.name}
            direction="row"
            justifyContent="center"
            alignItems="center"
          >
            <Text as="strong" fontWeight={700}>
              {team.name}
            </Text>
            {/* <Text as="span">{team.id + team.description}</Text> */}
            <Button variation="link" onClick={() => deleteTeam(team)}>
              Delete team
            </Button>
          </Flex>
        ))}
      </View>
      <Button onClick={signOut}>Sign Out</Button>
    </View>
  );
};

export default withAuthenticator(App);