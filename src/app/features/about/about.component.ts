import { Component, AfterViewInit, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss'
})
export class AboutComponent implements AfterViewInit {
  private el = inject(ElementRef);

  species = [
    {
      name: 'American White Oak',
      origin: 'North America',
      character: 'Dense, ring-porous grain with dramatic medullary rays. Exceptional structural durability.',
      usage: 'Salad bowls, platters, functional tableware',
      finish: 'Pure cold-pressed walnut oil'
    },
    {
      name: 'American Black Walnut',
      origin: 'Eastern North America',
      character: 'Deep umber heartwood with occasional purple undertones and pale amber sapwood ribbons.',
      usage: 'Turned vases, statement bowls, centerpieces',
      finish: 'Organic Danish oil and beeswax'
    },
    {
      name: "Bird's Eye Maple",
      origin: 'Northern Hardwood Forests',
      character: 'Rare swirling figure punctuated by tiny vortex eyes that catch light from changing angles.',
      usage: 'Artisan platters, decorative shallow bowls',
      finish: 'Hard-wax oil, microporous seal'
    },
    {
      name: 'Reclaimed Teak',
      origin: 'Aged Architectural Timber',
      character: 'High natural oil content, rich golden honey hue, and remarkable dimensional stability.',
      usage: 'Candleholders, desk objects, hollow vessels',
      finish: 'Hand-buffed natural carnauba wax'
    },
    {
      name: 'Indian Rosewood',
      origin: 'Southern India',
      character: 'Deep violet to chocolate striations. Heavy, resonant, and exceptionally smooth when cut on the bevel.',
      usage: 'Deep ceremonial bowls, bespoke pens',
      finish: 'Cold-pressed raw linseed oil'
    },
    {
      name: 'African Ebony',
      origin: 'West Africa',
      character: 'Nearly jet black with tight, dense grain that polishes naturally to a piano-sheen under the tool.',
      usage: 'Fine writing instruments, finials, accents',
      finish: 'High-friction natural burnish'
    }
  ];

  processSteps = [
    {
      step: '01',
      title: 'Timber Sourcing & Seasoning',
      desc: 'We select ethically harvested green or seasoned whole billets. Moisture content is carefully monitored over months before chucking to prevent checking and warp.'
    },
    {
      step: '02',
      title: 'Mounting & Roughing',
      desc: 'The timber block is centered between lathe centers. Using heavy roughing gouges at controlled rotational speeds, we shape the initial balanced cylinder.'
    },
    {
      step: '03',
      title: 'Hollowing & Wall Precision',
      desc: 'Specialized bowl gouges and shear scrapers pare away microns of wood. Wall thickness is verified by callipers for balance, weight, and visual tension.'
    },
    {
      step: '04',
      title: 'Natural Friction Finishing',
      desc: 'Surfaces are graduated down to ultra-fine grits while spinning. Natural plant oils and food-safe waxes are burnished directly into the wood pores under friction heat.'
    }
  ];

  ngAfterViewInit() {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) e.target.classList.add('visible');
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    const revealElements = this.el.nativeElement.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
    revealElements.forEach((elem: Element) => observer.observe(elem));
  }
}
