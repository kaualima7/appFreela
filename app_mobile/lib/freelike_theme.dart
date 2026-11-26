// Define as cores e os estilos compartilhados pelos componentes do app.

import 'package:flutter/material.dart';

const freelikeBlue = Color(0xFF24588C);
const freelikeInk = Color(0xFF253449);
const freelikeMuted = Color(0xFF5E6D7E);
const freelikeBorder = Color(0xFFDFE5EC);
const freelikeBackground = Color(0xFFF3F6FA);
const freelikeTint = Color(0xFFEAF1F8);

ThemeData buildFreelikeTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: freelikeBlue,
    primary: freelikeBlue,
    onPrimary: Colors.white,
    primaryContainer: freelikeTint,
    onPrimaryContainer: freelikeBlue,
    surface: Colors.white,
    onSurface: freelikeInk,
    onSurfaceVariant: freelikeMuted,
    outlineVariant: freelikeBorder,
  );
  final base = ThemeData(useMaterial3: true, colorScheme: scheme);
  final text = base.textTheme.apply(
    bodyColor: freelikeInk,
    displayColor: freelikeInk,
  );
  final buttonShape = RoundedRectangleBorder(
    borderRadius: BorderRadius.circular(12),
  );
  const fieldBorder = OutlineInputBorder(
    borderRadius: BorderRadius.all(Radius.circular(10)),
    borderSide: BorderSide(color: freelikeBorder),
  );

  return base.copyWith(
    scaffoldBackgroundColor: freelikeBackground,
    textTheme: text.copyWith(
      headlineMedium: text.headlineMedium?.copyWith(
        fontWeight: FontWeight.w700,
      ),
      headlineSmall: text.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
      titleLarge: text.titleLarge?.copyWith(fontWeight: FontWeight.w700),
      titleMedium: text.titleMedium?.copyWith(fontWeight: FontWeight.w700),
      bodyLarge: text.bodyLarge?.copyWith(height: 1.45),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.white,
      foregroundColor: freelikeInk,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: 0,
      toolbarHeight: 64,
      shape: Border(bottom: BorderSide(color: freelikeBorder)),
    ),
    cardTheme: CardThemeData(
      color: Colors.white,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: freelikeBorder),
      ),
    ),
    inputDecorationTheme: const InputDecorationThemeData(
      border: fieldBorder,
      enabledBorder: fieldBorder,
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.all(Radius.circular(10)),
        borderSide: BorderSide(color: freelikeBlue, width: 2),
      ),
      floatingLabelBehavior: FloatingLabelBehavior.always,
      contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 16),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size(0, 48),
        shape: buttonShape,
        textStyle: const TextStyle(fontWeight: FontWeight.w700),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(0, 48),
        shape: buttonShape,
        side: const BorderSide(color: freelikeBorder),
        textStyle: const TextStyle(fontWeight: FontWeight.w700),
      ),
    ),
  );
}
