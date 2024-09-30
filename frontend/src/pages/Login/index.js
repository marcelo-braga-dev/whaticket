import React, { useState, useContext, useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";

import {
  Avatar,
  Button,
  CssBaseline,
  TextField,
  Grid,
  Box,
  Typography,
  Container,
  InputAdornment,
  IconButton,
  Link,
} from "@material-ui/core";

import { LockOutlined, Visibility, VisibilityOff } from "@material-ui/icons";

import { makeStyles } from "@material-ui/core/styles";

import { i18n } from "../../translate/i18n";

import { AuthContext } from "../../context/Auth/AuthContext";
import axios from "axios";

// const Copyright = () => {
// 	return (
// 		<Typography variant="body2" color="textSecondary" align="center">
// 			{"Copyleft "}
// 			<Link color="inherit" href="https://github.com/canove">
// 				Canove
// 			</Link>{" "}
// 			{new Date().getFullYear()}
// 			{"."}
// 		</Typography>
// 	);
// };

const useStyles = makeStyles((theme) => ({
  paper: {
    marginTop: theme.spacing(8),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
  },
  form: {
    width: "100%", // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}));

const Login = () => {
  const classes = useStyles();
  const parentURL = document.referrer;

  const [user, setUser] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [usuarioExterno, setUsuarioExterno] = useState(null);

  const { handleLogin } = useContext(AuthContext);

  const handleChangeInput = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handlSubmit = (e) => {
    e.preventDefault();
    handleLogin(user);
  };

  useEffect(() => {
    if (window.self === window.top) return;
    // Envia a mensagem para a página pai solicitando a variável compartilhada
    window.parent.postMessage("getSharedVariable", parentURL);

    // Função de callback que lida com a resposta do postMessage
    const messageHandler = (event) => {
      const origin = `${event.origin}/`;

      // Verifica se a origem da resposta é confiável
      if (!origin.includes(parentURL)) return;

      const sharedValue = event.data.sharedVariable;

      if (sharedValue) {
        // Atualiza o estado apenas se a variável compartilhada for diferente do estado atual
        setUsuarioExterno((prev) => {
          if (prev === null) {
            return { email: sharedValue.email, password: sharedValue.password };
          }
          return prev; // Evita múltiplas atualizações
        });

        // Remove o listener para evitar repetição
        window.removeEventListener("message", messageHandler);
      }
    };

    // Adiciona o listener para receber mensagens
    window.addEventListener("message", messageHandler);

    // Limpeza do event listener ao desmontar o componente
    return () => {
      window.removeEventListener("message", messageHandler);
    };
  }, []); // Executa apenas uma vez ao montar o componente

  useEffect(() => {
    if (usuarioExterno)
      handleLogin({
        email: usuarioExterno.email,
        password: usuarioExterno.password,
      });
  }, [usuarioExterno]);

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <div className={classes.paper}>
        <img
          style={{ paddingTop: 10, maxHeight: 100 }}
          alt="logo"
          src="/assets/logo.png"
        />
        <form className={classes.form} noValidate onSubmit={handlSubmit}>
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="email"
            label={i18n.t("login.form.email")}
            name="email"
            value={user.email}
            onChange={handleChangeInput}
            autoComplete="email"
            autoFocus
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="password"
            label={i18n.t("login.form.password")}
            id="password"
            value={user.password}
            onChange={handleChangeInput}
            autoComplete="current-password"
            type={showPassword ? "text" : "password"}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword((e) => !e)}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            className={classes.submit}
          >
            {i18n.t("login.buttons.submit")}
          </Button>
          {/* <Grid container>
            <Grid item>
              <Link
                href="#"
                variant="body2"
                component={RouterLink}
                to="/signup"
              >
                {i18n.t("login.buttons.register")}
              </Link>
            </Grid>
          </Grid> */}
        </form>
      </div>
      <Box mt={8}>{/* <Copyright /> */}</Box>
    </Container>
  );
};

export default Login;
