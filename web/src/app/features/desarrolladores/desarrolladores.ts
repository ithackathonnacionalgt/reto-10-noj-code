import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-desarrolladores',
  imports: [RouterLink],
  templateUrl: './desarrolladores.html',
  styleUrl: './desarrolladores.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Desarrolladores {}
