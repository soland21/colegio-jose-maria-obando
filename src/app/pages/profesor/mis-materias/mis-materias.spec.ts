import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MisMaterias } from './mis-materias';
import { provideRouter } from '@angular/router';
import { routes } from '../../../app.routes';

describe('MisMaterias', () => {
  let component: MisMaterias;
  let fixture: ComponentFixture<MisMaterias>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MisMaterias],
      providers: [provideRouter(routes)],
    }).compileComponents();

    fixture = TestBed.createComponent(MisMaterias);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
