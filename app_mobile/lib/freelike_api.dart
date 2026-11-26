// Concentra as chamadas do app à mesma API usada pela Web.
// Cuida do login de cliente, cadastro, anúncios, likes e token mantido em memória.

import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import 'service.dart';

class ApiError implements Exception {
  const ApiError(this.message, {this.statusCode});

  final String message;
  final int? statusCode;
}

class FreelikeApi {
  FreelikeApi({required this.onSessionExpired});

  static const _configuredUrl = String.fromEnvironment('API_BASE_URL');
  static const _timeout = Duration(seconds: 12);

  final void Function() onSessionExpired;
  final _http = http.Client();
  String? _token;

  // Usa API_BASE_URL se informado; no emulador Android, 10.0.2.2 aponta para o computador.
  Uri get _baseUrl {
    if (_configuredUrl.isEmpty) {
      return kIsWeb
          ? Uri.base.resolve('/api/')
          : Uri.parse('http://10.0.2.2:3000/api/');
    }
    return Uri.base.resolve(
      '${_configuredUrl.replaceFirst(RegExp(r'/+$'), '')}/',
    );
  }

  //usa POST /api/auth/login da mesma API da Web; aceita CLIENT e guarda o token somente em memória
  Future<void> login(String email, String password) async {
    final json =
        await _request(
              'POST',
              'auth/login',
              body: {'email': email, 'password': password},
              authenticated: false,
            )
            as Map<String, dynamic>;
    _startClientSession(json);
  }

  // Cria uma conta CLIENT em POST /api/auth/register e inicia a sessão com o token recebido.
  Future<void> registerClient(
    String name,
    String email,
    String password,
  ) async {
    try {
      final json =
          await _request(
                'POST',
                'auth/register',
                body: {
                  'name': name,
                  'email': email,
                  'password': password,
                  'accountType': 'CLIENT',
                },
                authenticated: false,
              )
              as Map<String, dynamic>;
      _startClientSession(json);
    } on ApiError catch (error) {
      if (error.statusCode == 409) {
        throw const ApiError(
          'Este e-mail já está cadastrado.',
          statusCode: 409,
        );
      }
      if (error.statusCode == 400) {
        throw const ApiError(
          'Confira o nome, o e-mail e a senha.',
          statusCode: 400,
        );
      }
      rethrow;
    }
  }

  // Aceita somente conta de cliente no app e guarda o token até sair ou encerrar a execução.
  void _startClientSession(Map<String, dynamic> json) {
    final user = json['user'] as Map<String, dynamic>;
    if (user['accountType'] == 'FREELANCER') {
      throw const ApiError('A área de trabalho do freelancer fica na web.');
    }
    if (user['accountType'] != 'CLIENT') {
      throw const ApiError('Entre com uma conta de cliente.');
    }
    _token = json['access_token'] as String;
  }

  void logout() => _token = null;

  void close() => _http.close();

  //vitrine: GET /api/services retorna os anúncios publicados; ServiceOffer.fromJson organiza os dados para a tela
  Future<List<ServiceOffer>> catalog() async {
    final json = await _request('GET', 'services') as List<dynamic>;
    return json
        .map((row) => ServiceOffer.fromJson(row as Map<String, dynamic>))
        .toList();
  }

  // Consulta os detalhes do anúncio em GET /api/services/:id.
  Future<ServiceOffer> service(int serviceId) async {
    final json = await _request('GET', 'services/$serviceId');
    return ServiceOffer.fromJson(json as Map<String, dynamic>);
  }

  // Consulta /api/interests e verifica se o anúncio está entre os likes do cliente.
  Future<bool> isInterested(int serviceId) async {
    final json = await _request('GET', 'interests') as List<dynamic>;
    return json.any(
      (row) => (row as Map<String, dynamic>)['serviceId'] == serviceId,
    );
  }

  //like: POST ou DELETE /api/services/:id/interest; mesma API e registros usados pela Web
  Future<bool> changeInterest(int serviceId, bool interested) async {
    try {
      await _request(
        interested ? 'POST' : 'DELETE',
        'services/$serviceId/interest',
      );
      return interested;
    } on ApiError catch (error) {
      if ((interested && error.statusCode == 409) ||
          (!interested && error.statusCode == 404)) {
        return isInterested(serviceId);
      }
      rethrow;
    }
  }

  // Ajusta endereços locais das capas para que o app consiga acessá-las pelo endereço da API.
  String? coverUrl(String? imageUrl) {
    if (imageUrl == null || imageUrl.trim().isEmpty) return null;
    final uri = Uri.tryParse(imageUrl.trim());
    if (uri == null || !['http', 'https'].contains(uri.scheme)) return null;
    final segments = uri.pathSegments;
    // Capas locais podem sair da API com o endereço usado pela web.
    if (['localhost', '127.0.0.1', '::1'].contains(uri.host) &&
        segments.length == 4 &&
        segments[0] == 'api' &&
        segments[1] == 'services' &&
        segments[2] == 'covers') {
      return _baseUrl
          .resolve('services/covers/${Uri.encodeComponent(segments.last)}')
          .toString();
    }
    return uri.toString();
  }

  //centraliza HTTP, JSON, token Bearer, timeout e erros; 401 autenticado limpa a sessão e retorna ao login
  Future<dynamic> _request(
    String method,
    String path, {
    Map<String, String>? body,
    bool authenticated = true,
  }) async {
    final token = authenticated ? _token : null;
    try {
      final request = http.Request(method, _baseUrl.resolve(path))
        ..followRedirects = false
        ..headers['Accept'] = 'application/json';
      if (token != null) request.headers['Authorization'] = 'Bearer $token';
      if (body != null) {
        request.headers['Content-Type'] = 'application/json';
        request.body = jsonEncode(body);
      }

      final response = await _http
          .send(request)
          .then(http.Response.fromStream)
          .timeout(_timeout);
      final text = utf8.decode(response.bodyBytes);
      if (response.statusCode == 401 && token != null && token == _token) {
        logout();
        onSessionExpired();
      }
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw ApiError(switch (response.statusCode) {
          401 =>
            authenticated
                ? 'Sua sessão expirou. Entre novamente.'
                : 'E-mail ou senha inválidos.',
          403 => 'Sua conta não tem permissão para esta ação.',
          404 => 'Anúncio ou like indisponível.',
          _ => 'Não foi possível concluir. Tente novamente.',
        }, statusCode: response.statusCode);
      }
      return text.isEmpty ? null : jsonDecode(text);
    } on TimeoutException {
      throw const ApiError('A API demorou a responder. Tente novamente.');
    } on FormatException {
      throw const ApiError('Endereço da API ou resposta inválida.');
    } on http.ClientException {
      throw const ApiError('Não foi possível conectar à API.');
    }
  }
}
