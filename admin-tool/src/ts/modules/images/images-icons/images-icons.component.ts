import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ResourcesService } from '@admin-tool-services/resources.service';
import { ResourcesDoc } from '@admin-tool-modules/resources-interfaces';
import { ResponseStatus } from '@admin-tool-modules/global-modules-interfaces';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SecurityContext } from '@angular/core';

@Component({
  selector: 'images-icons',
  imports: [TranslatePipe, FormsModule],
  templateUrl: './images-icons.component.html',
  styleUrl: './images-icons.component.less'
})
export class ImagesIconsComponent implements OnInit {

  @ViewChild('nameInput') nameInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('iconFile') iconFileRef!: ElementRef<HTMLInputElement>;

  icons: string[] = [];
  resourcesDoc: ResourcesDoc | null = null;
  loadingPageStatus = false;
  responseStatus: ResponseStatus = {};
  iconName = '';

  constructor(
    private resourcesService: ResourcesService,
    private sanitizer: DomSanitizer
  ){}

  async ngOnInit(): Promise<void> {
    this.loadingPageStatus = true;
    
    try {
      this.resourcesDoc = await this.resourcesService.getResources();
      this.icons = Object.keys(this.resourcesDoc.resources);
    } catch (error) {
      console.error('Error fetching resources file', error);
    } finally {
      this.loadingPageStatus = false;
    }
  }

  private async reloadIcons(): Promise<void> {
    try {
      this.resourcesDoc = await this.resourcesService.getResources();
      this.icons = Object.keys(this.resourcesDoc.resources);
    } catch (error) {
      console.error('Error fetching resources file', error);
    }
  }

  getIconContent(iconName: string): { isSvg: boolean; content: string | SafeHtml } {
    if (!this.resourcesDoc || !iconName) {
      return { isSvg: false, content: '' };
    }
    const result = this.resourcesService.getIconContent(iconName, this.resourcesDoc);
    if (result.isSvg) {
      return {
        isSvg: true,
        content: this.sanitizer.bypassSecurityTrustHtml(result.content)
      };
    }
    return result;
  }

  //TODO
  async upload(): Promise<void> {
    
  }

}
