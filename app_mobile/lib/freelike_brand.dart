// Widget reutilizado para mostrar o símbolo e o nome do Freelike nas telas.

import 'package:flutter/material.dart';

class FreelikeBrand extends StatelessWidget {
  const FreelikeBrand({super.key, this.large = false});

  final bool large;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final size = large ? 44.0 : 36.0;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Image.asset(
          'assets/freelike-symbol.png',
          width: size,
          height: size,
          excludeFromSemantics: true,
        ),
        const SizedBox(width: 6),
        Text.rich(
          TextSpan(
            text: 'Freelike',
            children: [
              TextSpan(
                text: '.',
                style: TextStyle(color: theme.colorScheme.primary),
              ),
            ],
          ),
          style:
              (large ? theme.textTheme.titleLarge : theme.textTheme.titleMedium)
                  ?.copyWith(letterSpacing: -0.4),
        ),
      ],
    );
  }
}
